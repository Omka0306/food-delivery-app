import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Save, Loader2 } from 'lucide-react'
import { aiApi } from '@/services/aiApi'
import toast from 'react-hot-toast'

const FITNESS_GOALS = [
  { value: 'weight_loss',       label: 'Weight Loss',      emoji: '🏃' },
  { value: 'muscle_gain',       label: 'Muscle Gain',      emoji: '💪' },
  { value: 'maintain',          label: 'Maintain',         emoji: '⚖️' },
  { value: 'general_wellness',  label: 'General Wellness', emoji: '🌿' },
]

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free', 'Keto', 'Paleo',
]

const ALLERGY_OPTIONS = [
  'Nuts', 'Shellfish', 'Eggs', 'Soy', 'Wheat', 'Milk',
]

const MOODS = [
  { emoji: '😊', label: 'Happy'     },
  { emoji: '💪', label: 'Energetic' },
  { emoji: '😴', label: 'Tired'     },
  { emoji: '😤', label: 'Stressed'  },
  { emoji: '🤒', label: 'Sick'      },
  { emoji: '😌', label: 'Relaxed'   },
]

function CheckBox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={onChange}
        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          checked ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-400'
        }`}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm text-gray-700 select-none">{label}</span>
    </label>
  )
}

function SectionHeader({ children }) {
  return <h3 className="text-sm font-bold text-gray-700 mb-3">{children}</h3>
}

export default function AIProfileSettings() {
  const queryClient = useQueryClient()

  const [fitnessGoal,   setFitnessGoal]   = useState('general_wellness')
  const [dietary,       setDietary]       = useState([])
  const [allergies,     setAllergies]     = useState([])
  const [mood,          setMood]          = useState('')

  // Load existing profile
  useQuery({
    queryKey: ['ai-profile'],
    queryFn:  async () => {
      const res  = await aiApi.getProfile()
      const data = res.data?.data || {}
      if (data.fitnessGoal)           setFitnessGoal(data.fitnessGoal)
      if (Array.isArray(data.dietary)) setDietary(data.dietary)
      if (Array.isArray(data.allergies)) setAllergies(data.allergies)
      if (data.mood)                  setMood(data.mood)
      return data
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const saveMutation = useMutation({
    mutationFn: () => aiApi.updateProfile({ fitnessGoal, dietary, allergies, mood }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-profile'] })
      toast.success('AI preferences saved! 🎉')
    },
    onError: () => {
      toast.error('Could not save preferences. Try again.')
    },
  })

  const toggleCheck = (list, setList, value) => {
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-sm leading-tight">AI Preferences</h2>
          <p className="text-xs text-gray-400">Personalise your meal recommendations</p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-6">
        {/* Fitness goal */}
        <section>
          <SectionHeader>Fitness Goal</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            {FITNESS_GOALS.map((g) => {
              const active = fitnessGoal === g.value
              return (
                <motion.button
                  key={g.value}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setFitnessGoal(g.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                    active
                      ? 'bg-purple-50 border-purple-400 text-purple-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-purple-300'
                  }`}
                >
                  <span className="text-base">{g.emoji}</span>
                  {g.label}
                  {active && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                  )}
                </motion.button>
              )
            })}
          </div>
        </section>

        {/* Dietary restrictions */}
        <section>
          <SectionHeader>Dietary Restrictions</SectionHeader>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
            {DIETARY_OPTIONS.map((opt) => (
              <CheckBox
                key={opt}
                label={opt}
                checked={dietary.includes(opt)}
                onChange={() => toggleCheck(dietary, setDietary, opt)}
              />
            ))}
          </div>
        </section>

        {/* Allergies */}
        <section>
          <SectionHeader>Allergies</SectionHeader>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
            {ALLERGY_OPTIONS.map((opt) => (
              <CheckBox
                key={opt}
                label={opt}
                checked={allergies.includes(opt)}
                onChange={() => toggleCheck(allergies, setAllergies, opt)}
              />
            ))}
          </div>
        </section>

        {/* Mood today */}
        <section>
          <SectionHeader>Mood Today</SectionHeader>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const active = mood === m.label
              return (
                <motion.button
                  key={m.label}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setMood(active ? '' : m.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                    active
                      ? 'bg-amber-50 border-amber-400 text-amber-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-300'
                  }`}
                >
                  <span>{m.emoji}</span>
                  {m.label}
                </motion.button>
              )
            })}
          </div>
        </section>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-sm"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveMutation.isPending ? 'Saving…' : 'Save Preferences'}
        </motion.button>
      </div>
    </div>
  )
}
