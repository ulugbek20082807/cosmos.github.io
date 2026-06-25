/**
 * emailApi.js
 * Securely triggers EmailJS to send feedback without leaking the destination email address.
 */

export async function sendFeedbackEmail(type, message, senderName) {
  // Uses the user's provided EmailJS keys
  const data = {
    service_id: 'service_5xe7oho',
    template_id: 'template_3vtecrk',
    user_id: '_aTNfokN9eKvvICpS',
    template_params: {
      type: type,          // 'Bug' or 'Suggestion'
      message: message,    
      from_name: senderName || 'Anonymous Astronaut',
      from_email: 'ulugbekrahmatullayev2008@gmail.com', // Dummy sender
      reply_to: 'ulugbekrahmatullayev2008@gmail.com'
    }
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed to send email')
  }

  return true
}
