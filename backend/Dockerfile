FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    addgroup --system appgroup && adduser --system --ingroup appgroup appuser
COPY . .
RUN chown -R appuser:appgroup /app
COPY --chmod=755 entrypoint.sh .
USER appuser
EXPOSE 8000
CMD ["./entrypoint.sh"]
