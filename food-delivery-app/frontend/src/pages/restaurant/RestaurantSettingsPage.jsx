import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { restaurantApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

const CUISINES = ['American', 'Italian', 'Indian', 'Chinese', 'Mexican', 'Other']

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map((d) => [d, { open: '09:00', close: '22:00', closed: false }])
)

export default function RestaurantSettingsPage() {
  const { user } = useAuthStore()
  const restaurantId = user?.restaurantId

  const [form, setForm] = useState({
    restaurantName: '', cuisine: 'Indian', description: '', address: '', phone: '',
  })
  const [hours, setHours] = useState(DEFAULT_HOURS)

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant-settings', restaurantId],
    queryFn: async () => {
      const res = await restaurantApi.getMenuItems(restaurantId)
      return res.data.data
    },
    enabled: false,
  })

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        restaurantName: user.restaurantName || user.name || '',
      }))
    }
  }, [user])

  const save = useMutation({
    mutationFn: () => restaurantApi.updateSettings(restaurantId, { ...form, operatingHours: hours }),
    onSuccess: () => toast.success('Settings saved'),
    onError: (err) => toast.error(err.message || 'Failed to save settings'),
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const setHour = (day, field, value) =>
    setHours((h) => ({ ...h, [day]: { ...h[day], [field]: value } }))

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800">Settings</h1>

      {/* Restaurant details */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-semibold text-gray-700">Restaurant Details</h2>

        <div className="space-y-1.5">
          <Label>Restaurant Name</Label>
          <Input value={form.restaurantName} onChange={set('restaurantName')} placeholder="Restaurant name" />
        </div>

        <div className="space-y-1.5">
          <Label>Cuisine Type</Label>
          <select
            value={form.cuisine}
            onChange={set('cuisine')}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            {CUISINES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="Contact number" />
        </div>

        <div className="space-y-1.5">
          <Label>Address</Label>
          <textarea
            value={form.address}
            onChange={set('address')}
            placeholder="Full restaurant address"
            rows={2}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={set('description')}
            placeholder="Tell customers about your restaurant…"
            rows={3}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 resize-none"
          />
        </div>
      </div>

      {/* Operating hours */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">Operating Hours</h2>
        <div className="space-y-3">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3">
              <div className="w-24 flex-shrink-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hours[day].closed}
                    onChange={(e) => setHour(day, 'closed', !e.target.checked)}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                  />
                  <span className="text-sm text-gray-700">{day.slice(0, 3)}</span>
                </label>
              </div>
              {hours[day].closed ? (
                <span className="text-sm text-gray-400">Closed</span>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={hours[day].open}
                    onChange={(e) => setHour(day, 'open', e.target.value)}
                    className="px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="time"
                    value={hours[day].close}
                    onChange={(e) => setHour(day, 'close', e.target.value)}
                    className="px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {save.isPending
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
          : <><Save className="w-4 h-4 mr-2" /> Save Settings</>
        }
      </Button>
    </div>
  )
}
