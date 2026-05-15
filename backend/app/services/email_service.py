"""Email service using AWS SES via boto3."""

from typing import Dict, List

from fastapi import HTTPException, status

from app.config import settings


def send_bulk_email(
    recipients: List[Dict[str, str]],
    subject: str,
    body: str,
) -> dict:
    """Send individual emails to multiple recipients using AWS SES.

    Args:
        recipients: List of dicts with 'name' and 'email' keys.
        subject: Email subject line.
        body: Plain-text email body.

    Returns:
        Summary dict with sent/failed counts.

    Raises:
        HTTPException 503: If AWS SES credentials are not fully configured.
    """
    if not all(
        [
            settings.AWS_ACCESS_KEY_ID,
            settings.AWS_SECRET_ACCESS_KEY,
            settings.AWS_SES_FROM_EMAIL,
        ]
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Email service not configured. Please set AWS_ACCESS_KEY_ID, "
                "AWS_SECRET_ACCESS_KEY, AWS_SES_REGION, and AWS_SES_FROM_EMAIL "
                "in your .env file."
            ),
        )

    import boto3  # lazy import so tests without AWS creds don't fail at import time
    from botocore.exceptions import ClientError

    ses_client = boto3.client(
        "ses",
        region_name=settings.AWS_SES_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    sent = 0
    failed = 0
    errors: List[str] = []

    for recipient in recipients:
        personalized_body = f"Dear {recipient['name']},\n\n{body}"
        try:
            ses_client.send_email(
                Source=settings.AWS_SES_FROM_EMAIL,
                Destination={"ToAddresses": [recipient["email"]]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {"Text": {"Data": personalized_body, "Charset": "UTF-8"}},
                },
            )
            sent += 1
        except ClientError as exc:
            failed += 1
            errors.append(f"{recipient['email']}: {exc.response['Error']['Message']}")

    return {
        "sent": sent,
        "failed": failed,
        "total": len(recipients),
        "errors": errors,
    }
