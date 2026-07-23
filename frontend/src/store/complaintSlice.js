import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api/api'

const emptyForm = {
  complaint_source: '',
  customer_name: '',
  product_name: '',
  product_strength_grade: '',
  batch_lot_number: '',
  manufacturing_date: '',
  expiry_date: '',
  quantity_affected: '',
  complaint_type: '',
  complaint_date: '',
  detailed_description: '',
  initial_severity: '',
  priority: '',
}

const emptyAiInsights = {
  completeness_score: null,
  missing_fields: [],
  ai_summary: '',
  root_cause_recommendation: '',
  capa_recommendation: '',
  risk_classification: '',
  risk_justification: '',
  duplicate_of: null,
  duplicate_confidence: null,
  agent_trace: [],
}

export const fetchComplaints = createAsyncThunk('complaints/fetchAll', async () => {
  const { data } = await api.get('/complaints')
  return data
})

export const saveComplaint = createAsyncThunk('complaints/save', async (formData) => {
  const { data } = await api.post('/complaints', formData)
  return data
})

export const runExtraction = createAsyncThunk(
  'complaints/extract',
  async ({ file, text }) => {
    const body = new FormData()
    if (file) body.append('file', file)
    if (text) body.append('text', text)
    const { data } = await api.post('/ai/extract', body)
    return data
  }
)

const complaintSlice = createSlice({
  name: 'complaints',
  initialState: {
    form: emptyForm,
    aiInsights: emptyAiInsights,
    list: [],
    status: 'idle', // idle | extracting | saving | loading
    extractionProgress: 0,
    error: null,
  },
  reducers: {
    updateField(state, action) {
      const { field, value } = action.payload
      state.form[field] = value
    },
    resetForm(state) {
      state.form = emptyForm
      state.aiInsights = emptyAiInsights
      state.extractionProgress = 0
    },
    setExtractionProgress(state, action) {
      state.extractionProgress = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComplaints.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.status = 'idle'
        state.list = action.payload
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.status = 'idle'
        state.error = action.error.message
      })
      .addCase(runExtraction.pending, (state) => {
        state.status = 'extracting'
        state.error = null
      })
      .addCase(runExtraction.fulfilled, (state, action) => {
        state.status = 'idle'
        state.extractionProgress = 100
        const { extracted_fields, ...insights } = action.payload
        state.form = { ...state.form, ...extracted_fields }
        state.aiInsights = insights
      })
      .addCase(runExtraction.rejected, (state, action) => {
        state.status = 'idle'
        state.error = action.error.message
      })
      .addCase(saveComplaint.pending, (state) => {
        state.status = 'saving'
        state.error = null
      })
      .addCase(saveComplaint.fulfilled, (state) => {
        state.status = 'idle'
      })
      .addCase(saveComplaint.rejected, (state, action) => {
        state.status = 'idle'
        state.error = action.error.message
      })
  },
})

export const { updateField, resetForm, setExtractionProgress } = complaintSlice.actions
export default complaintSlice.reducer