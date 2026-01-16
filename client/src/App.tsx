import { useState, useEffect } from 'react'
// import axios from 'axios' // Uncomment when ready to use real API
import './App.css'
import { processClaim, getClaimsData } from './api'

interface MenuItem {
  id: string
  label: string
  icon: string
  description: string
  category: 'main' | 'personal' | 'business' | 'claims' | 'tools' | 'account'
}

interface User {
  id: string
  firstName: string
  lastName: string
  username: string
  password: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  username: string
  password: string
  department: string
  role: string
}

interface Claim {
  id: string
  claimId: string
  userId: string
  name: string
  claimType: string
  incidentDate: string
  incidentLocation: string
  description: string
  damageAmount: string
  summary: string
  extract_claim_fields: string
  validate_claim: string
  fraud_check: string
  summarize_claim: string
}


// Hardcoded user data
const HARDCODED_USERS: User[] = [
  {
    id: '1',
    firstName: 'Prathmesh',
    lastName: 'Gunthey',
    username: 'pgunthey',
    password: 'password123'
  },
  {
    id: '2',
    firstName: 'John',
    lastName: 'Doe',
    username: 'jdoe',
    password: 'password123'
  },
  {
    id: '3',
    firstName: 'Jane',
    lastName: 'Smith',
    username: 'jsmith',
    password: 'password123'
  }
]

// Hardcoded employee data
const HARDCODED_EMPLOYEES: Employee[] = [
  {
    id: 'emp1',
    firstName: 'Robert',
    lastName: 'Wilson',
    username: 'rwilson',
    password: 'employee123',
    department: 'Claims Processing',
    role: 'Claims Manager'
  },
  {
    id: 'emp2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    username: 'sjohnson',
    password: 'employee123',
    department: 'Claims Review',
    role: 'Senior Claims Reviewer'
  }
]

// Hardcoded claims data - organized by user ID
const HARDCODED_CLAIMS: Record<string, Claim[]> = {
  '1': [
    {
      id: '1',
      claimId: 'CLM001',
      userId: '1',
      name: 'Prathmesh Gunthey',
      claimType: 'Auto Accident',
      incidentDate: '2026-01-10',
      incidentLocation: 'New York, NY',
      description: 'Car collision on highway',
      damageAmount: '5000',
      summary: 'Can be processed. Claim has clear incident details and consistent timeline with verified police report on file.',
      extract_claim_fields: '2026-01-15T22:03:56.819Z',
      validate_claim: '2026-01-15T22:04:26.419Z',
      fraud_check: '2026-01-15T22:05:18.450Z',
      summarize_claim: '2026-01-15T22:05:49.560Z',
    },
    {
      id: '1',
      claimId: 'CLM002',
      userId: '1',
      name: 'Prathmesh Gunthey',
      claimType: 'Property Damage',
      incidentDate: '2026-01-03',
      incidentLocation: 'Boston, MA',
      description: 'Storm damage to roof',
      damageAmount: '8000',
      summary: 'Can be processed. Weather records confirm storm event on claim date and damage assessment aligns with repair estimates.',
      extract_claim_fields: '2026-01-04T11:20:00Z',
      validate_claim: '2026-01-04T11:28:15Z',
      fraud_check: '2026-01-04T11:42:00Z',
      summarize_claim: '2026-01-04T12:00:00Z',
    }
  ],
  '2': [
    {
      id: '2',
      claimId: 'CLM001',
      userId: '2',
      name: 'John Doe',
      claimType: 'Property Damage',
      incidentDate: '2026-01-08',
      incidentLocation: 'Los Angeles, CA',
      description: 'Water damage to home',
      damageAmount: '12000',
      summary: 'Cannot be processed. Suspicious discrepancies found between claim amount and damage assessment; multiple inconsistencies in timeline.',
      extract_claim_fields: '2026-01-09T14:15:00Z',
      validate_claim: '2026-01-09T14:22:45Z',
      fraud_check: '2026-01-09T14:35:00Z',
      summarize_claim: '2026-01-09T14:50:30Z',
    }
  ],
  '3': [
    {
      id: '3',
      claimId: 'CLM001',
      userId: '3',
      name: 'Jane Smith',
      claimType: 'Health Claim',
      incidentDate: '2026-01-05',
      incidentLocation: 'Chicago, IL',
      description: 'Emergency room visit',
      damageAmount: '3500',
      summary: 'Can be processed. Emergency room visit verified with hospital records and valid insurance coverage at time of incident.',
      extract_claim_fields: '2026-01-06T09:00:00Z',
      validate_claim: '2026-01-06T09:08:20Z',
      fraud_check: '2026-01-06T09:20:10Z',
      summarize_claim: '2026-01-06T09:35:00Z',
    }
  ]
}

const menuItems: MenuItem[] = [
  // Main Services
  { id: 'dashboard', label: 'Dashboard', icon: '📊', description: 'View your insurance overview', category: 'main' },
  { id: 'claim-intake', label: 'Claim Intake', icon: '📝', description: 'File a new insurance claim', category: 'claims' },
  { id: 'rating', label: 'Get Quote & Rating', icon: '⭐', description: 'Get instant insurance quotes', category: 'main' },
  { id: 'create-policy', label: 'Create Policy', icon: '📋', description: 'Create a new insurance policy', category: 'main' },
  
  // Personal Insurance
  { id: 'personal-auto', label: 'Personal Auto Insurance', icon: '🚗', description: 'Car and vehicle insurance coverage', category: 'personal' },
  { id: 'homeowners', label: 'Homeowners Insurance', icon: '🏠', description: 'Protect your home and belongings', category: 'personal' },
  { id: 'renters', label: 'Renters Insurance', icon: '🏢', description: 'Insurance for renters', category: 'personal' },
  { id: 'life-insurance', label: 'Life Insurance', icon: '💓', description: 'Life and term insurance plans', category: 'personal' },
  { id: 'health-insurance', label: 'Health Insurance', icon: '⚕️', description: 'Medical and health coverage', category: 'personal' },
  { id: 'disability', label: 'Disability Insurance', icon: '🛡️', description: 'Income protection insurance', category: 'personal' },
  { id: 'umbrella', label: 'Umbrella Insurance', icon: '☂️', description: 'Additional liability protection', category: 'personal' },
  
  // Business Insurance
  { id: 'business-insurance', label: 'Business Insurance', icon: '💼', description: 'Comprehensive business coverage', category: 'business' },
  { id: 'general-liability', label: 'General Liability', icon: '⚖️', description: 'Business liability insurance', category: 'business' },
  { id: 'property-insurance', label: 'Commercial Property', icon: '🏭', description: 'Protect business property', category: 'business' },
  { id: 'cyber-insurance', label: 'Cyber Insurance', icon: '🔒', description: 'Cyber security and data protection', category: 'business' },
  { id: 'workers-comp', label: 'Workers Compensation', icon: '👷', description: 'Employee injury coverage', category: 'business' },
  { id: 'professional-liability', label: 'Professional Liability', icon: '👔', description: 'Professional services insurance', category: 'business' },
  { id: 'commercial-auto', label: 'Commercial Auto', icon: '🚐', description: 'Vehicle insurance for business', category: 'business' },
  
  // Claims Management
  { id: 'claim-status', label: 'Claim Status', icon: '📍', description: 'Track your insurance claims', category: 'claims' },
  { id: 'claim-history', label: 'Claim History', icon: '📚', description: 'View past claims and details', category: 'claims' },
  { id: 'claim-documents', label: 'Upload Documents', icon: '📄', description: 'Submit claim documentation', category: 'claims' },
  
  // Tools & Services
  { id: 'coverage-calculator', label: 'Coverage Calculator', icon: '🧮', description: 'Calculate insurance coverage needs', category: 'tools' },
  { id: 'comparison-tool', label: 'Compare Plans', icon: '⚔️', description: 'Compare insurance plans side by side', category: 'tools' },
  { id: 'risk-assessment', label: 'Risk Assessment', icon: '⚠️', description: 'Evaluate your insurance risks', category: 'tools' },
  { id: 'faq', label: 'FAQ & Support', icon: '❓', description: 'Frequently asked questions', category: 'tools' },
  { id: 'documents', label: 'Policy Documents', icon: '📖', description: 'Download your policy documents', category: 'tools' },
  
  // Account Management
  { id: 'profile', label: 'My Profile', icon: '👤', description: 'Manage your profile information', category: 'account' },
  { id: 'payments', label: 'Payments & Billing', icon: '💳', description: 'Manage your billing and payments', category: 'account' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', description: 'Configure notification preferences', category: 'account' },
]

const categoryLabels: Record<string, string> = {
  main: 'Main Services',
  personal: 'Personal Insurance',
  business: 'Business Insurance',
  claims: 'Claims Management',
  tools: 'Tools & Resources',
  account: 'Account Management',
}

function App() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null)
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(null)
  const [signInMode, setSignInMode] = useState<'user' | 'employee'>('user')
  const [signInUsername, setSignInUsername] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInError, setSignInError] = useState('')
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [isClaimIntakeModalOpen, setIsClaimIntakeModalOpen] = useState(false)
  const [selectedUserForReview, setSelectedUserForReview] = useState<User | null>(null)
  const [selectedClaimForReview, setSelectedClaimForReview] = useState<Claim | null>(null)
  const [claimFormData, setClaimFormData] = useState({
    claimType: '',
    incidentDate: '',
    incidentLocation: '',
    description: '',
    damageAmount: '',
    agreeTerms: false,
    name: '',
    id: ''
  })
  const [claimFormError, setClaimFormError] = useState('')
  const [claimSubmitSuccess, setClaimSubmitSuccess] = useState(false)
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [showIntakeJourneyModal, setShowIntakeJourneyModal] = useState(false)
  const [claimsData, setClaimsData] = useState<Record<string, Claim[]>>(() => JSON.parse(JSON.stringify(HARDCODED_CLAIMS)))
  const [isLoadingClaims, setIsLoadingClaims] = useState(false)

  const claimTypes = [
    'Auto Accident',
    'Property Damage',
    'Health Claim',
    'Life Insurance',
    'Disability Claim',
    'Business Liability',
    'Workers Compensation',
    'Other'
  ]

  const filteredItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedItems = Object.entries(categoryLabels).reduce((acc, [key, _]) => {
    acc[key] = filteredItems.filter(item => item.category === key)
    return acc
  }, {} as Record<string, MenuItem[]>)

  const fetchClaimsData = async () => {
    setIsLoadingClaims(true)
    try {
      const response = await getClaimsData()
      if (response.ok) {
        const data = await response.json()
        // Deep copy to avoid reference issues
        const newClaimsData = JSON.parse(JSON.stringify(data))
        setClaimsData(newClaimsData)
      } else {
        console.error('Failed to fetch claims data')
        setClaimsData(JSON.parse(JSON.stringify(HARDCODED_CLAIMS)))
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
      setClaimsData(JSON.parse(JSON.stringify(HARDCODED_CLAIMS)))
    } finally {
      setIsLoadingClaims(false)
    }
  }

  useEffect(() => {
    if (loggedInEmployee) {
      fetchClaimsData()
    }
  }, [loggedInEmployee])

  const handleSignIn = () => {
    setSignInError('')
    
    if (signInMode === 'user') {
      const user = HARDCODED_USERS.find(
        u => u.username === signInUsername && u.password === signInPassword
      )
      if (user) {
        setLoggedInUser(user)
        setLoggedInEmployee(null)
        setIsSignInModalOpen(false)
        setSignInUsername('')
        setSignInPassword('')
      } else {
        setSignInError('Invalid username or password')
      }
    } else {
      const employee = HARDCODED_EMPLOYEES.find(
        e => e.username === signInUsername && e.password === signInPassword
      )
      if (employee) {
        setLoggedInEmployee(employee)
        setLoggedInUser(null)
        setIsSignInModalOpen(false)
        setSignInUsername('')
        setSignInPassword('')
      } else {
        setSignInError('Invalid username or password')
      }
    }
  }

  const handleSignOut = () => {
    setShowLogoutConfirmation(true)
  }

  const confirmLogout = () => {
    setLoggedInUser(null)
    setLoggedInEmployee(null)
    setSelectedUserForReview(null)
    setSelectedClaimForReview(null)
    setShowLogoutConfirmation(false)
  }

  const cancelLogout = () => {
    setShowLogoutConfirmation(false)
  }

  const handleClaimIntakeClick = () => {
    if (!loggedInUser) {
      setIsSignInModalOpen(true)
      return
    }
    setClaimFormError('')
    setClaimFormData({
      claimType: '',
      incidentDate: '',
      incidentLocation: '',
      description: '',
      damageAmount: '',
      agreeTerms: false,
      name:'',
      id:''
    })
    setIsClaimIntakeModalOpen(true)
  }

  const convertClaimDataToSentence = (data: typeof claimFormData, user: any) => {
    return `Name is ${user.firstName} ${user.lastName}, claim type is ${data.claimType}, incident date is ${data.incidentDate}, incident location is ${data.incidentLocation}, damage amount is $${data.damageAmount}, description is ${data.description}.`
  }

  const handleSubmitClaim = () => {
    setClaimFormError('')
    
    if (!claimFormData.claimType) {
      setClaimFormError('Please select a claim type')
      return
    }
    if (!claimFormData.incidentDate) {
      setClaimFormError('Please enter the incident date')
      return
    }
    if (!claimFormData.incidentLocation) {
      setClaimFormError('Please enter the incident location')
      return
    }
    if (!claimFormData.description) {
      setClaimFormError('Please provide a description of the incident')
      return
    }
    if (!claimFormData.damageAmount) {
      setClaimFormError('Please enter the damage amount')
      return
    }
    if (!claimFormData.agreeTerms) {
      setClaimFormError('You must agree to the terms and conditions')
      return
    }

    // Make POST API call
    setClaimSubmitting(true)
    const claimSentence = convertClaimDataToSentence(claimFormData, loggedInUser)
    claimFormData.name = loggedInUser?.firstName + ' ' + loggedInUser?.lastName;
    claimFormData.id = loggedInUser?.id || "";
    processClaim(claimSentence, claimFormData)
    // Promise.resolve({ status: 202 }) // Mocked API response
      .then((response) => {
        if (response.status === 202) {
          setClaimSubmitSuccess(true)
          setClaimFormError('')
          // Auto-close modal after 3 seconds
          setTimeout(() => {
            setIsClaimIntakeModalOpen(false)
            setClaimSubmitSuccess(false)
            setClaimFormData({
              claimType: '',
              incidentDate: '',
              incidentLocation: '',
              description: '',
              damageAmount: '',
              agreeTerms: false,
              name:'',
              id: ''
            })
          }, 3000)
        }
      })
      .catch((error) => {
        console.error('Error submitting claim:', error)
        setClaimFormError(
          error.response?.data?.message || 
          'Failed to submit claim. Please try again.'
        )
      })
      .finally(() => {
        setClaimSubmitting(false)
      })
  }

  const handleClaimInputChange = (field: string, value: any) => {
    setClaimFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-icon">🛡️</span>
            <h1>SecureInsure</h1>
          </div>
          <nav className="header-nav">
            <a href="#" className="nav-link">Home</a>
            <a href="#" className="nav-link">About</a>
            <a href="#" className="nav-link">Contact</a>
            {loggedInUser ? (
              <div className="user-section">
                <span className="user-name">👤 {loggedInUser.firstName} {loggedInUser.lastName}</span>
                <button className="sign-in-btn logout-btn" onClick={handleSignOut}>Sign Out</button>
              </div>
            ) : loggedInEmployee ? (
              <div className="user-section">
                <span className="user-name">👨‍💼 {loggedInEmployee.firstName} {loggedInEmployee.lastName} <span className="employee-badge">{loggedInEmployee.role}</span></span>
                <button className="sign-in-btn logout-btn" onClick={handleSignOut}>Sign Out</button>
              </div>
            ) : (
              <button className="sign-in-btn" onClick={() => setIsSignInModalOpen(true)}>Sign In</button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h2>Your Trusted Insurance Partner</h2>
          <p>Comprehensive insurance solutions for your personal and business needs</p>
        </div>
      </section>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search insurance products and services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {loggedInEmployee ? (
          // Employee Dashboard
          <div className="employee-dashboard">
            <div className="employee-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <h2>Claims Management Dashboard</h2>
                  <p>Review and manage customer claims</p>
                </div>
                <button 
                  className="refresh-btn"
                  onClick={fetchClaimsData}
                  disabled={isLoadingClaims}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoadingClaims ? 'not-allowed' : 'pointer',
                    opacity: isLoadingClaims ? 0.6 : 1
                  }}
                >
                  {isLoadingClaims ? 'Loading...' : '🔄 Refresh'}
                </button>
              </div>
            </div>

            <div className="employee-content-grid">
              {/* Users List */}
              <div className="users-list-panel">
                <h3>Customer List</h3>
                <div className="users-list">
                  {Object.keys(claimsData).map(userId => {
                    const userClaims = claimsData[userId] || []
                    const firstClaim = userClaims[0]
                    const userName = firstClaim?.name || `User ${userId}`
                    const nameParts = userName.split(' ')
                    
                    return (
                      <div
                        key={userId}
                        className={`user-card ${selectedUserForReview?.id === userId ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedUserForReview({ 
                            id: userId, 
                            firstName: nameParts[0], 
                            lastName: nameParts[1] || '', 
                            username: '', 
                            password: '' 
                          })
                          setSelectedClaimForReview(null)
                        }}
                      >
                        <div className="user-card-info">
                          <h4>{userName}</h4>
                          <p className="user-id">ID: {userId}</p>
                          <p className="user-claims-count">
                            <span className="claim-badge">{userClaims.length}</span> Claims
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Claims and Details */}
              <div className="claims-details-panel">
                {selectedUserForReview ? (
                  <>
                    <div className="selected-user-header">
                      <h3>{selectedUserForReview.firstName} {selectedUserForReview.lastName}</h3>
                      <p className="user-id">Member ID: {selectedUserForReview.id}</p>
                    </div>

                    <div className="claims-list">
                      <h4>Claims ({(claimsData[selectedUserForReview.id] || []).length})</h4>
                      {(claimsData[selectedUserForReview.id] || []).length > 0 ? (
                        (claimsData[selectedUserForReview.id] || []).map((claim) => (
                          <div
                            key={claim.claimId}
                            className={`claim-card ${selectedClaimForReview?.claimId === claim.claimId ? 'active' : ''}`}
                            onClick={() => setSelectedClaimForReview(claim)}
                          >
                            <div className="claim-header">
                              <span className="claim-id">{claim.claimId}</span>
                            </div>
                            <div className="claim-info">
                              <p><strong>Type:</strong> {claim.claimType}</p>
                              <p><strong>Amount:</strong> ${parseFloat(claim.damageAmount).toLocaleString()}</p>
                              <p><strong>Date:</strong> {new Date(claim.incidentDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-claims">No claims found for this customer</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <p>Select a customer to view their claims</p>
                  </div>
                )}
              </div>

              {/* Claim Details */}
              {selectedClaimForReview && (
                <div className="claim-detail-panel">
                  <div className="claim-detail-header">
                    <h4>Claim Details</h4>
                  </div>
                  <div className="claim-detail-content">
                    <div className="detail-row">
                      <span className="label">Claim ID:</span>
                      <span className="value">{selectedClaimForReview.claimId}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">User ID:</span>
                      <span className="value">{selectedClaimForReview.id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Claimant Name:</span>
                      <span className="value">{selectedClaimForReview.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Claim Type:</span>
                      <span className="value">{selectedClaimForReview.claimType}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Incident Date:</span>
                      <span className="value">{new Date(selectedClaimForReview.incidentDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Location:</span>
                      <span className="value">{selectedClaimForReview.incidentLocation}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Damage Amount:</span>
                      <span className="value amount">${parseFloat(selectedClaimForReview.damageAmount).toLocaleString()}</span>
                    </div>
                    <div className="detail-row full-width">
                      <span className="label">Description:</span>
                      <p className="value description">{selectedClaimForReview.description}</p>
                    </div>
                    <div className="detail-row full-width">
                      <span className="label">Summary:</span>
                      <p className="value description">{selectedClaimForReview.summary}</p>
                    </div>
                  </div>
                  <div className="claim-actions">
                    <button className="action-btn approve-btn">Approve Claim</button>
                    <button className="action-btn reject-btn">Reject Claim</button>
                    <button className="action-btn review-btn">Request More Info</button>
                    <button className="action-btn journey-btn" onClick={() => setShowIntakeJourneyModal(true)}>
                      View Intake Journey
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        ) : (
          // User Dashboard
          <div className="content-wrapper">
            {/* Sidebar - Featured Services */}
            <aside className="sidebar">
              {/* Sidebar - Featured Services */}
              <div className="featured-box">
                <h3>Quick Links</h3>
                <button className="featured-btn primary">
                  Get a Quote Today
                </button>
                <button className="featured-btn secondary">
                  File a Claim
                </button>
                <button className="featured-btn secondary">
                  View My Policies
                </button>
              </div>
              <div className="info-box">
                <h4>Customer Support</h4>
                <p>📞 1-800-SECURE-99</p>
                <p>📧 support@secureinsure.com</p>
                <p>Available 24/7</p>
              </div>
            </aside>

            {/* Main Grid */}
            <div className="menu-section">
              {Object.entries(groupedItems).map(([categoryKey, items]) =>
                items.length > 0 && (
                  <div key={categoryKey} className="category-group">
                    <h2 className="category-title">{categoryLabels[categoryKey]}</h2>
                    <div className="menu-grid">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`menu-card ${selectedItem === item.id ? 'active' : ''}`}
                          onClick={() => setSelectedItem(item.id)}
                        >
                          <div className="card-icon">{item.icon}</div>
                          <h3 className="card-title">{item.label}</h3>
                          <p className="card-description">{item.description}</p>
                          <button 
                            className="card-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (item.id === 'claim-intake') {
                                handleClaimIntakeClick()
                              }
                            }}
                          >
                            Explore →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Detail Panel */}
            {selectedItem && (
              <div className="detail-panel">
                <div className="detail-content">
                  <button className="close-btn" onClick={() => setSelectedItem(null)}>×</button>
                  {(() => {
                    const item = menuItems.find(m => m.id === selectedItem)
                    return (
                      <>
                        <div className="detail-icon">{item?.icon}</div>
                        <h2>{item?.label}</h2>
                        <p className="detail-description">{item?.description}</p>
                        <div className="detail-features">
                          <h4>Key Features:</h4>
                          <ul>
                            <li>✓ Comprehensive coverage options</li>
                            <li>✓ Competitive rates and discounts</li>
                            <li>✓ Easy claim processing</li>
                            <li>✓ 24/7 customer support</li>
                          </ul>
                        </div>
                        <button className="action-btn">Get Started Now</button>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About SecureInsure</h4>
            <p>Your trusted partner in insurance since 2010</p>
          </div>
          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li><a href="#">Personal Insurance</a></li>
              <li><a href="#">Business Insurance</a></li>
              <li><a href="#">Claims Support</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Connect With Us</h4>
            <div className="social-links">
              <a href="#">Facebook</a>
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
            </div>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 SecureInsure. All rights reserved.</p>
        </div>
      </footer>

      {/* Intake Journey Modal */}
      {showIntakeJourneyModal && selectedClaimForReview && (
        <div className="modal-overlay" onClick={() => setShowIntakeJourneyModal(false)}>
          <div className="modal journey-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Claim Intake Journey</h2>
              <button className="modal-close" onClick={() => setShowIntakeJourneyModal(false)}>×</button>
            </div>
            <div className="modal-body journey-modal-body">
              {selectedClaimForReview && (
                <div className="journey-graph-grid">
                  <div className="journey-nodes-grid">
                    { selectedClaimForReview.extract_claim_fields && (
                    <div className="journey-node node-1">
                      <div className="node-circle-small"></div>
                      <div className="node-label">Extract Data</div>
                      <div className="node-timestamp">
                        {selectedClaimForReview.extract_claim_fields}
                      </div>
                    </div>
                    )}
                    { selectedClaimForReview.validate_claim && (
                    <div className="journey-node node-2">
                      <div className="node-circle-small"></div>
                      <div className="node-label">Data Validation</div>
                      <div className="node-timestamp">
                        {selectedClaimForReview.validate_claim}
                      </div>
                    </div>
 )}
                    { selectedClaimForReview.fraud_check && (
                    <div className="journey-node node-3">
                      <div className="node-circle-small"></div>
                      <div className="node-label">Fraud Screening</div>
                      <div className="node-timestamp">
                        {selectedClaimForReview.fraud_check}
                      </div>
                    </div>
 )}
                    { selectedClaimForReview.summarize_claim && (
                    <div className="journey-node node-4">
                      <div className="node-circle-small"></div>
                      <div className="node-label">Data Summary</div>
                      <div className="node-timestamp">
                        {selectedClaimForReview.summarize_claim}
                      </div>
                    </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowIntakeJourneyModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      {isSignInModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSignInModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sign In</h2>
              <button className="modal-close" onClick={() => setIsSignInModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Sign In Mode Toggle */}
              <div className="signin-mode-toggle">
                <button 
                  className={`mode-btn ${signInMode === 'user' ? 'active' : ''}`}
                  onClick={() => {
                    setSignInMode('user')
                    setSignInError('')
                  }}
                >
                  👤 User
                </button>
                <button 
                  className={`mode-btn ${signInMode === 'employee' ? 'active' : ''}`}
                  onClick={() => {
                    setSignInMode('employee')
                    setSignInError('')
                  }}
                >
                  👨‍💼 Employee
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  placeholder="Enter your username"
                  value={signInUsername}
                  onChange={(e) => setSignInUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                />
              </div>
              {signInError && <div className="error-message">{signInError}</div>}
              <div className="demo-hint">
                <p><strong>Demo Credentials:</strong></p>
                {signInMode === 'user' ? (
                  <>
                    <p>Username: <code>pgunthey</code>, <code>jdoe</code>, or <code>jsmith</code></p>
                    <p>Password: <code>password123</code></p>
                  </>
                ) : (
                  <>
                    <p>Username: <code>rwilson</code> or <code>sjohnson</code></p>
                    <p>Password: <code>employee123</code></p>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsSignInModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSignIn}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmation && (
        <div className="modal-overlay" onClick={cancelLogout}>
          <div className="modal confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Logout</h2>
            </div>
            <div className="modal-body">
              <p className="confirmation-message">Are you sure you want to sign out?</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmLogout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Intake Modal */}
      {isClaimIntakeModalOpen && loggedInUser && (
        <div className="modal-overlay" onClick={() => setIsClaimIntakeModalOpen(false)}>
          <div className="modal claim-intake-modal" onClick={(e) => e.stopPropagation()}>
            {claimSubmitSuccess ? (
              <>
                <div className="success-message-container">
                  <div className="success-icon">✓</div>
                  <h2>Request Submitted Successfully!</h2>
                  <p>Your claim has been submitted and is being processed.</p>
                  <p className="claim-reference">Closing in 3 seconds...</p>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header">
                  <h2>File an Insurance Claim</h2>
                  <button className="modal-close" onClick={() => setIsClaimIntakeModalOpen(false)}>×</button>
                </div>
                <div className="modal-body claim-modal-body">
                  {/* User Info Section */}
                  <div className="claim-section">
                    <h4>Your Information</h4>
                    <div className="form-group-row">
                      <div className="form-group">
                        <label htmlFor="user-name">Full Name</label>
                        <input
                          id="user-name"
                          type="text"
                          className="form-input"
                          value={`${loggedInUser.firstName} ${loggedInUser.lastName}`}
                          disabled
                          readOnly
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="user-id">Member ID</label>
                        <input
                          id="user-id"
                          type="text"
                          className="form-input"
                          value={loggedInUser.id}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* Claim Details Section */}
                  <div className="claim-section">
                    <h4>Claim Details</h4>
                    <div className="form-group">
                      <label htmlFor="claim-type">Claim Type *</label>
                      <select
                        id="claim-type"
                        className="form-input form-select"
                        value={claimFormData.claimType}
                        onChange={(e) => handleClaimInputChange('claimType', e.target.value)}
                      >
                        <option value="">Select a claim type...</option>
                        {claimTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group-row">
                      <div className="form-group">
                        <label htmlFor="incident-date">Incident Date *</label>
                        <input
                          id="incident-date"
                          type="date"
                          className="form-input"
                          value={claimFormData.incidentDate}
                          onChange={(e) => handleClaimInputChange('incidentDate', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="damage-amount">Damage Amount ($) *</label>
                        <input
                          id="damage-amount"
                          type="number"
                          className="form-input"
                          placeholder="0.00"
                          value={claimFormData.damageAmount}
                          onChange={(e) => handleClaimInputChange('damageAmount', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="incident-location">Incident Location *</label>
                      <input
                        id="incident-location"
                        type="text"
                        className="form-input"
                        placeholder="Enter the location of the incident"
                        value={claimFormData.incidentLocation}
                        onChange={(e) => handleClaimInputChange('incidentLocation', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="description">Description of Incident *</label>
                      <textarea
                        id="description"
                        className="form-input form-textarea"
                        placeholder="Please provide detailed information about the incident"
                        rows={4}
                        value={claimFormData.description}
                        onChange={(e) => handleClaimInputChange('description', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Terms and Conditions Section */}
                  <div className="claim-section">
                    <div className="checkbox-group">
                      <input
                        id="agree-terms"
                        type="checkbox"
                        checked={claimFormData.agreeTerms}
                        onChange={(e) => handleClaimInputChange('agreeTerms', e.target.checked)}
                      />
                      <label htmlFor="agree-terms" className="checkbox-label">
                        I certify that the information provided is true and accurate. I understand that filing a false claim is illegal. *
                      </label>
                    </div>
                  </div>

                  {claimFormError && <div className="error-message">{claimFormError}</div>}
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn-secondary" 
                    onClick={() => setIsClaimIntakeModalOpen(false)}
                    disabled={claimSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleSubmitClaim}
                    disabled={claimSubmitting}
                  >
                    {claimSubmitting ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
