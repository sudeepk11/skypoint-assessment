import React, { useState } from 'react';
import { X, Mail, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { email as emailService } from '../services/api';

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationIds: string[];
}

type Template = 'interview_invite' | 'application_update' | 'rejection' | 'custom';

const templates: Record<Template, { label: string; subject: string; body: string }> = {
  interview_invite: {
    label: 'Interview Invitation',
    subject: 'Interview Invitation — [Position]',
    body: `Dear Candidate,

We are pleased to invite you for an interview for the position you applied for at Skypoint.ai.

We were impressed by your application and would love the opportunity to discuss your background and how it aligns with our needs.

Please reply to this email with your availability for the next week, and we will schedule a time that works for both parties.

We look forward to speaking with you.

Best regards,
The Skypoint Hiring Team`,
  },
  application_update: {
    label: 'Application Status Update',
    subject: 'Your Application Status Update',
    body: `Dear Candidate,

We wanted to update you on your application with Skypoint.ai.

Your application is currently under review by our hiring team. We are carefully evaluating all candidates and will be in touch with next steps shortly.

Thank you for your patience throughout this process.

Best regards,
The Skypoint Hiring Team`,
  },
  rejection: {
    label: 'Rejection Notice',
    subject: 'Application Status Update',
    body: `Dear Candidate,

Thank you for your interest in joining Skypoint.ai and for taking the time to apply for our open position.

After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs. This was a difficult decision as we received many strong applications.

We encourage you to apply for future openings that match your skills and experience. We will keep your information on file.

We wish you the best in your job search.

Best regards,
The Skypoint Hiring Team`,
  },
  custom: {
    label: 'Custom Message',
    subject: '',
    body: '',
  },
};

const BulkEmailModal: React.FC<BulkEmailModalProps> = ({ isOpen, onClose, applicationIds }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('interview_invite');
  const [subject, setSubject] = useState(templates.interview_invite.subject);
  const [body, setBody] = useState(templates.interview_invite.body);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTemplateChange = (t: Template) => {
    setSelectedTemplate(t);
    setSubject(templates[t].subject);
    setBody(templates[t].body);
    setError(null);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message body are required.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await emailService.sendBulk(applicationIds, subject, body);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 503) {
        setError(
          'Email service not configured. Please add AWS SES credentials to your .env file.'
        );
      } else {
        setError('Failed to send emails. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Send Bulk Email</h2>
              <p className="text-sm text-gray-500">
                Sending to {applicationIds.length} candidate{applicationIds.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Emails sent successfully!
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Template selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(templates) as Template[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTemplateChange(t)}
                  className={`px-3 py-2 text-sm rounded-lg border text-left transition-all ${
                    selectedTemplate === t
                      ? 'border-accent bg-blue-50 text-accent font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {templates[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email subject..."
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Email body..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || success}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-accent hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={14} />
                Send Emails
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEmailModal;
