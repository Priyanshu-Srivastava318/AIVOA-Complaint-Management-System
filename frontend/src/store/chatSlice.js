import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api/api'

export const sendChatMessage = createAsyncThunk(
  'chat/send',
  async ({ message, complaintId }) => {
    const { data } = await api.post('/ai/chat', { message, complaint_id: complaintId })
    return data
  }
)

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [
      {
        role: 'assistant',
        content:
          'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.',
      },
    ],
    sending: false,
  },
  reducers: {
    addUserMessage(state, action) {
      state.messages.push({ role: 'user', content: action.payload })
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.sending = true
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sending = false
        state.messages.push(action.payload)
      })
      .addCase(sendChatMessage.rejected, (state) => {
        state.sending = false
        state.messages.push({
          role: 'assistant',
          content: "Sorry, I couldn't reach the AI service. Please try again.",
        })
      })
  },
})

export const { addUserMessage } = chatSlice.actions
export default chatSlice.reducer
