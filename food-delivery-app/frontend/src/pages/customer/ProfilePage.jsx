import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, ShieldCheck, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/services/apiClient'

const ROLE_BADGE = {
  customer:   { label: 'Customer',            color: 'bg-orange-100 text-orange-700' },
  restaurant: { label: 'Restaurant Partner',  color: 'bg-blue-100 text-blue-700' },
  admin:      { label: 'Admin',               color: 'bg-purple-100 text-purple-700' },
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()

  const [name,    setName]    = useState(user?.name  || '')
  const [phone,   setPhone]   = useState(user?.phone || '')
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    document.title = 'My Profile — QuickBite'
  }, [])

  useEffect(() => {
    setName(user?.name  || '')
    setPhone(user?.phone || '')
  }, [user])

  const badge = ROLE_BADGE[user?.role] || ROLE_BADGE.customer

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return toast.error('Name and phone are required')
    if (!/^[0-9]{10}$/.test(phone)) return toast.error('Phone must be exactly 10 digits')

    setSaving(true)
    setSuccess(false)
    try {
      await apiClient.patch('/auth/profile', { name: name.trim(), phone: phone.trim() })
      setUser({ ...user, name: name.trim(), phone: phone.trim() })
      setSuccess(true)
      toast.success('Profile updated!')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface py-10 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your account information</p>
          </div>

          {/* Avatar card */}
          <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-800 truncate">{user?.name || '—'}</p>
              <p className="text-sm text-gray-400 truncate">{user?.email}</p>
              <span className={`mt-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Edit form */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Edit Information
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-gray-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {/* Email — read-only */}
              <div className="space-y-1.5">
                <Label className="text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={user?.email || ''}
                    readOnly
                    className="pl-9 bg-gray-50 cursor-default text-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-400">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-gray-700">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    type="tel"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full h-11 bg-gradient-to-r from-primary to-orange-400 hover:from-orange-600 hover:to-orange-500 font-semibold"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                ) : success ? (
                  <><CheckCircle className="w-4 h-4 mr-2" /> Saved!</>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
