import './Nav.css'

const NAV_ITEMS = [
  {
    id: 'circle',
    label: 'Círculo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.5" />
        <line x1="12" y1="3" x2="12" y2="8.5" />
        <line x1="12" y1="15.5" x2="12" y2="21" />
        <line x1="3" y1="12" x2="8.5" y2="12" />
        <line x1="15.5" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
  {
    id: 'explorer',
    label: 'Explorador',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    id: 'chords',
    label: 'Acordes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="5" width="20" height="14" rx="1" />
        <line x1="7" y1="5" x2="7" y2="19" />
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="17" y1="5" x2="17" y2="19" />
        <circle cx="9.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'saved',
    label: 'Guardadas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
]

export default function Nav({ activeTab, setActiveTab }) {
  return (
    <nav className="nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`nav-item${activeTab === item.id ? ' active' : ''}`}
          onClick={() => setActiveTab(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
