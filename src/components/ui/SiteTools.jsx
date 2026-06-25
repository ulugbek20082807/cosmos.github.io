import { useState, useEffect } from 'react'
import { sendFeedbackEmail } from '../../utils/emailApi'

export function SiteTools() {
  const [visits, setVisits] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState('Bug')
  const [message, setMessage] = useState('')
  const [senderName, setSenderName] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error

  useEffect(() => {
    // Fetch visit counter
    fetch('https://api.counterapi.dev/v1/ulugbek-cosmos/visits/up')
      .then(res => res.json())
      .then(data => {
        if (data && data.count) setVisits(data.count)
      })
      .catch(err => console.error('Failed to update visit counter:', err))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setStatus('loading')
    try {
      await sendFeedbackEmail(feedbackType, message, senderName)
      setStatus('success')
      setTimeout(() => {
        setIsModalOpen(false)
        setStatus('idle')
        setMessage('')
        setSenderName('')
      }, 2000)
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <div className="site-tools-container">
      {/* Sleek Visit Counter */}
      <div className="visit-counter">
        <span className="visit-icon">🛰️</span>
        <span className="visit-text">Cosmic Explorers:</span>
        <span className="visit-number">{visits !== null ? visits.toLocaleString() : '...'}</span>
      </div>

      {/* Floating Action Button for Feedback */}
      <button className="feedback-fab" onClick={() => setIsModalOpen(true)} title="Report Bug or Suggestion">
        💬
      </button>

      {/* Feedback Modal */}
      {isModalOpen && (
        <div className="feedback-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="feedback-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            <h2>Mission Control Uplink</h2>
            <p>Report an anomaly or suggest a new feature for the simulation.</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Transmission Type</label>
                <select value={feedbackType} onChange={e => setFeedbackType(e.target.value)}>
                  <option value="Bug">Anomaly / Bug Report</option>
                  <option value="Suggestion">Feature Suggestion</option>
                </select>
              </div>

              <div className="form-group">
                <label>Explorer Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Commander Shepard" 
                  value={senderName} 
                  onChange={e => setSenderName(e.target.value)}
                  disabled={status === 'loading'}
                />
              </div>

              <div className="form-group">
                <label>Message Content</label>
                <textarea 
                  placeholder="Describe the anomaly or feature..." 
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <button 
                type="submit" 
                className={`submit-btn ${status}`}
                disabled={status === 'loading' || !message.trim()}
              >
                {status === 'idle' && 'Transmit Message'}
                {status === 'loading' && 'Transmitting...'}
                {status === 'success' && 'Transmission Successful!'}
                {status === 'error' && 'Transmission Failed. Try Again.'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
