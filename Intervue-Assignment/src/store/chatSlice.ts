import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  unreadCount: number;
}

const initialState: ChatState = {
  messages: [],
  isOpen: false,
  unreadCount: 0,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      if (!state.isOpen) {
        state.unreadCount++;
      }
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
    },
    setChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
      if (action.payload) {
        state.unreadCount = 0;
      }
    },
    clearUnreadCount: (state) => {
      state.unreadCount = 0;
    },
  },
});

export const { addMessage, setMessages, setChatOpen, clearUnreadCount } = chatSlice.actions;
export default chatSlice.reducer;