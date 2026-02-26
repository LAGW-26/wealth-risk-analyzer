"use client"

import { useRouter } from "next/navigation"

import { useState } from "react"
function QuestionCard({
  title,
  field,
  options,
  formData,
  updateField,
}: any) {
  return (
    <div>
      <h3 className="font-medium mb-3">{title}</h3>
      <div className="space-y-3">
        {options.map((option: any) => {
          const selected = formData[field] === option.value
          return (
            <div
              key={option.value}
              onClick={() => updateField(field, option.value)}
              className={`p-4 border rounded-xl cursor-pointer transition ${
                selected
                  ? "border-black bg-gray-100"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {option.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

type GuardrailsProps = {
  formData: Record<string, any>
  updateField: (field: string, value: any) => void
  prevStep: () => void
}

function GuardrailsSection({
  formData,
  updateField,
  prevStep,
}: GuardrailsProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const questions = [
    {
      field: "advisorContactPreference",
      title: "During future market declines, would you prefer to…",
      options: [
        { label: "Be contacted before any action is taken", value: 1 },
        { label: "Receive reassurance and updates", value: 2 },
        { label: "Take no action unless goals change", value: 3 },
      ],
    },
    {
      field: "rulePreference",
      title: "I feel more comfortable investing when…",
      options: [
        { label: "I can adjust strategy frequently", value: 1 },
        { label: "I have flexibility within limits", value: 2 },
        { label: "A clear long-term plan is followed", value: 3 },
      ],
    },
    {
      field: "stressAwareness",
      title:
        "Market volatility makes me anxious, even when I understand it’s normal.",
      options: [
        { label: "Strongly agree", value: 1 },
        { label: "Agree", value: 2 },
        { label: "Disagree", value: 3 },
        { label: "Strongly disagree", value: 4 },
      ],
    },
  ]

  // safer check (handles 0 properly if ever used)
  const allAnswered = questions.every(
    (q) => formData[q.field] !== undefined && formData[q.field] !== null
  )

  const handleSubmit = async () => {
    // 1. Prevent action if already submitting or if not all answered
    if (!allAnswered || isSubmitting) return

    setIsSubmitting(true) // 2. Turn on loading sign

    try {
      const response = await fetch("/api/analyze-risk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const text = await response.text()
      
      if (!response.ok) {
        throw new Error(text)
      }

      const result = JSON.parse(text)

      // Mapping IDs to the exact HubSpot Dropdown strings
      // Add the [key: string]: string type definition here
      const assetLabels: { [key: string]: string } = {
        "1": "Under $100k",
        "2": "$100k-$500k",
        "3": "$500k-$1M",
        "4": "$1M-$5M",
        "5": "$5m+"
      };

      // 🔥 ENRICH DATA: Carry your formData into the result 
      // Mapping the numeric ID to the text string HubSpot expects
      const enrichedResult = {
        ...result,
        profile: {
          ...result.profile,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          // Converts "2" to "$100k-$500k"
          investableAssets: assetLabels[formData.assets] || formData.assets, 
        }
      }

      router.push(
        `/results?data=${encodeURIComponent(JSON.stringify(enrichedResult))}`
      )
    } catch (error) {
      console.error("Submit error:", error)
      // 3. IMPORTANT: Reset loading so user can try again if it fails
      setIsSubmitting(false) 
    }
  }


  return (
    <div className="space-y-8">
      {questions.map((question) => (
        <QuestionCard
          key={question.field}
          title={question.title}
          field={question.field}
          options={question.options}
          formData={formData}
          updateField={updateField}
        />
      ))}


      <div className="flex justify-between pt-6">
        <button
          onClick={prevStep}
          className="px-6 py-3 border rounded-lg"
        >
          ← Back
        </button>

        <button
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all ${
            allAnswered && !isSubmitting
              ? "bg-blue-600 text-white hover:opacity-90"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              {/* Simple CSS Spinner */}
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            "Submit Assessment →"
          )}
        </button>
      </div>
    </div>
  )
}

function ConsistencySection({
  formData,
  updateField,
  nextStep,
  prevStep,
}: any) {
  const questions = [
    {
      field: "selfAssessment",
      title:
        "How would you describe your overall comfort with investment risk?",
      options: [
        { label: "Very low", value: 1 },
        { label: "Low", value: 2 },
        { label: "Moderate", value: 3 },
        { label: "High", value: 4 },
      ],
    },
    {
      field: "reverseLossGrowth",
      title:
        "I would rather accept short-term losses than limit long-term growth.",
      options: [
        { label: "Strongly disagree", value: 1 },
        { label: "Disagree", value: 2 },
        { label: "Agree", value: 3 },
        { label: "Strongly agree", value: 4 },
      ],
      reverse: true,
    },
    {
      field: "marketExperience",
      title:
        "Have you invested through a major market downturn before?",
      options: [
        { label: "No", value: 1 },
        { label: "Yes, but it was very stressful", value: 2 },
        { label: "Yes, and I stayed invested", value: 3 },
        { label: "Yes, and I increased investments", value: 4 },
      ],
    },
    {
      field: "newsSensitivity",
      title:
        "How often do market headlines influence your investment decisions?",
      options: [
        { label: "Very often", value: 1 },
        { label: "Sometimes", value: 2 },
        { label: "Rarely", value: 3 },
        { label: "Almost never", value: 4 },
      ],
    },
    {
      field: "decisionStyle",
      title:
        "When making financial decisions, I tend to rely more on…",
      options: [
        { label: "Gut instinct", value: 1 },
        { label: "A mix of intuition and analysis", value: 2 },
        { label: "Data and structured planning", value: 3 },
      ],
    },
  ]

  const allAnswered = questions.every(
    (q) => formData[q.field] !== undefined && formData[q.field] !== null
  )


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">
        Consistency & Calibration
      </h1>
      <p className="text-gray-500">
        These questions help validate your overall risk profile.
      </p>

      {questions.map((q) => (
        <QuestionCard
          key={q.field}
          title={q.title}
          field={q.field}
          options={q.options}
          formData={formData}
          updateField={updateField}
        />
      ))}

      <div className="flex justify-between pt-6">
        <button
          onClick={prevStep}
          className="text-gray-600"
        >
          ← Back
        </button>

        <button
          onClick={() => {
            if (allAnswered) nextStep()
          }}
          disabled={!allAnswered}
          className={`px-6 py-3 rounded-lg ${
            allAnswered
              ? "bg-black text-white hover:opacity-90"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

function BehavioralSection({
  formData,
  updateField,
  nextStep,
  prevStep,
}: any) {
  const questions = [
    {
      field: "lossReaction",
      title:
        "Imagine your portfolio falls 20% in a short period due to market conditions. What would you most likely do?",
      options: [
        { label: "Sell most investments to prevent further loss", value: 1 },
        { label: "Sell some and wait for stability", value: 2 },
        { label: "Do nothing and wait it out", value: 3 },
        { label: "Invest more while prices are lower", value: 4 },
      ],
    },
    {
      field: "volatilityPreference",
      title: "Which portfolio would you prefer?",
      options: [
        { label: "Small steady returns with minimal ups and downs", value: 1 },
        { label: "Moderate ups and downs with moderate growth", value: 2 },
        { label: "Larger swings with higher long-term growth", value: 3 },
        { label: "Significant swings for chance of high returns", value: 4 },
      ],
    },
    {
      field: "regretSensitivity",
      title: "Which outcome would bother you more?",
      options: [
        { label: "Missing out on gains because you were cautious", value: 4 },
        { label: "Experiencing losses because you took too much risk", value: 1 },
      ],
    },
    {
      field: "drawdownThreshold",
      title:
        "At what point would investment losses start to feel unacceptable?",
      options: [
        { label: "Around 5%", value: 1 },
        { label: "Around 10%", value: 2 },
        { label: "Around 20%", value: 3 },
        {
          label: "Losses wouldn’t concern me unless fundamentals changed",
          value: 4,
        },
      ],
    },
    {
      field: "ambiguityTolerance",
      title:
        "How do you feel about investments where outcomes are uncertain but potentially rewarding?",
      options: [
        { label: "Very uncomfortable", value: 1 },
        { label: "Somewhat uncomfortable", value: 2 },
        { label: "Generally comfortable", value: 3 },
        { label: "Very comfortable", value: 4 },
      ],
    },
    {
      field: "downturnBehavior",
      title:
        "During market downturns, I believe the best approach is to…",
      options: [
        { label: "Act quickly to avoid further damage", value: 1 },
        { label: "Reduce risk until conditions improve", value: 2 },
        { label: "Stick with the plan despite discomfort", value: 3 },
        { label: "Increase risk if long-term outlook is intact", value: 4 },
      ],
    },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  const current = questions[currentIndex]

  const nextQuestion = () => {
    if (!formData[current.field]) return

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      nextStep()
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    } else {
      prevStep()
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">
        Behavioral Risk Assessment
      </h1>

      <p className="text-gray-500">
        Question {currentIndex + 1} of {questions.length}
      </p>

      <QuestionCard
        title={current.title}
        field={current.field}
        options={current.options}
        formData={formData}
        updateField={updateField}
      />

      <div className="flex justify-between pt-6">
        <button
          onClick={prevQuestion}
          className="text-gray-600"
        >
          ← Back
        </button>

        <button
          onClick={nextQuestion}
          disabled={!formData[current.field]}
          className={`px-6 py-3 rounded-lg ${
            formData[current.field]
              ? "bg-black text-white hover:opacity-90"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {currentIndex === questions.length - 1
            ? "Continue →"
            : "Next →"}
        </button>
      </div>
    </div>
  )
}

export default function RiskAssessment() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<any>({})
  const [attemptedNext, setAttemptedNext] = useState(false)

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const validateStepOne = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      /^\S+@\S+\.\S+$/.test(formData.email) &&
      formData.timeHorizon &&
      formData.assets
    )
  }

  const nextStep = () => {
    if (step === 1) {
      setAttemptedNext(true)
      if (!validateStepOne()) return
    }
    setStep((s) => s + 1)
  }

  const prevStep = () => setStep((s) => s - 1)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-10">

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-black rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Step {step} of 5
          </p>
        </div>

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-semibold">
              Investor Profile
            </h1>
            <p className="text-gray-500">
              Please provide your basic information before beginning the assessment.
            </p>

            {/* First Name */}
            <div>
              <input
                type="text"
                placeholder="First Name"
                className={`w-full border p-3 rounded-lg ${
                  attemptedNext && !formData.firstName
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                value={formData.firstName || ""}
                onChange={(e) => updateField("firstName", e.target.value)}
              />
              {attemptedNext && !formData.firstName && (
                <p className="text-sm text-red-500 mt-1">
                  First name is required
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <input
                type="text"
                placeholder="Last Name"
                className={`w-full border p-3 rounded-lg ${
                  attemptedNext && !formData.lastName
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                value={formData.lastName || ""}
                onChange={(e) => updateField("lastName", e.target.value)}
              />
              {attemptedNext && !formData.lastName && (
                <p className="text-sm text-red-500 mt-1">
                  Last name is required
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email"
                className={`w-full border p-3 rounded-lg ${
                  attemptedNext &&
                  (!formData.email ||
                    !/^\S+@\S+\.\S+$/.test(formData.email))
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                value={formData.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
              />
              {attemptedNext && !formData.email && (
                <p className="text-sm text-red-500 mt-1">
                  Email is required
                </p>
              )}
              {attemptedNext &&
                formData.email &&
                !/^\S+@\S+\.\S+$/.test(formData.email) && (
                  <p className="text-sm text-red-500 mt-1">
                    Please enter a valid email address
                  </p>
                )}
            </div>

            {/* Time Horizon */}
            <div>
              <label className="block mb-2 font-medium">
                When do you expect to need a meaningful portion of this money?
              </label>
              <select
                className={`w-full border p-3 rounded-lg ${
                  attemptedNext && !formData.timeHorizon
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                value={formData.timeHorizon || ""}
                onChange={(e) => updateField("timeHorizon", e.target.value)}
              >
                <option value="">Select</option>
                <option value="1">Less than 3 years</option>
                <option value="2">3–7 years</option>
                <option value="3">7–15 years</option>
                <option value="4">15+ years</option>
              </select>
              {attemptedNext && !formData.timeHorizon && (
                <p className="text-sm text-red-500 mt-1">
                  Time horizon selection is required
                </p>
              )}
            </div>

            {/* Investable Assets */}
            <div>
              <label className="block mb-2 font-medium">
                Approximate Investable Assets
              </label>
              <select
                className={`w-full border p-3 rounded-lg ${
                  attemptedNext && !formData.assets
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                value={formData.assets || ""}
                onChange={(e) => updateField("assets", e.target.value)}
              >
                <option value="">Select</option>
                <option value="1">Under $100k</option>
                <option value="2">$100k–$500k</option>
                <option value="3">$500k–$1M</option>
                <option value="4">$1M–$5M</option>
                <option value="5">$5M+</option>
              </select>
              {attemptedNext && !formData.assets && (
                <p className="text-sm text-red-500 mt-1">
                  Investable assets selection is required
                </p>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <button
                onClick={nextStep}
                className="bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}

      
        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <div className="space-y-8">
            <h1 className="text-3xl font-semibold">
              Risk Capacity
            </h1>
            <p className="text-gray-500">
              These questions assess objective financial stability factors.
            </p>

            {/* Q2 Income Stability */}
            <QuestionCard
              title="Which best describes your primary income?"
              field="incomeStability"
              options={[
                { label: "Very stable (salary, pension)", value: 4 },
                { label: "Mostly stable with some variability", value: 3 },
                { label: "Variable (commission, business income)", value: 2 },
                { label: "Not currently earning income", value: 1 },
              ]}
              formData={formData}
              updateField={updateField}
            />

            {/* Q3 Liquidity Buffer */}
            <QuestionCard
              title="If your income stopped today, how long could you cover expenses without selling investments?"
              field="liquidityBuffer"
              options={[
                { label: "More than 12 months", value: 4 },
                { label: "6–12 months", value: 3 },
                { label: "3–6 months", value: 2 },
                { label: "Less than 3 months", value: 1 },
              ]}
              formData={formData}
              updateField={updateField}
            />

            {/* Q4 Dependents */}
            <QuestionCard
              title="Do others rely on this money for near-term needs?"
              field="dependents"
              options={[
                { label: "No dependents", value: 4 },
                { label: "Not directly", value: 3 },
                { label: "Yes, partially", value: 2 },
                { label: "Yes, critically", value: 1 },
              ]}
              formData={formData}
              updateField={updateField}
            />

            <div className="flex justify-between pt-6">
              <button
                onClick={prevStep}
                className="text-gray-600"
              >
                ← Back
              </button>

              <button
                onClick={() => {
                  if (
                    formData.incomeStability &&
                    formData.liquidityBuffer &&
                    formData.dependents
                  ) {
                    nextStep()
                  }
                }}
                className={`px-6 py-3 rounded-lg ${
                  formData.incomeStability &&
                  formData.liquidityBuffer &&
                  formData.dependents
                    ? "bg-black text-white hover:opacity-90"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Next →
              </button>
            </div>
          </div>
        )}
        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <BehavioralSection
            formData={formData}
            updateField={updateField}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {/* ================= STEP 4 ================= */}
        {step === 4 && (
          <ConsistencySection
            formData={formData}
            updateField={updateField}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {/* ================= STEP 5 ================= */}
        {step === 5 && (
          <GuardrailsSection
            formData={formData}
            updateField={updateField}
            prevStep={prevStep}
          />
        )}




      </div>
    </div>
  )
}
