import React, { useState, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import { toast } from 'react-toastify'
import MessageSound from '@assets/mp3/message_sound.mp3'
import { Image } from 'lucide-react'
interface FormChatProps {
  chatId: string
  socket: Socket
  partnerOut: () => void
}

interface Message {
  type: 'text' | 'image'
  content: string
  sender: 'me' | 'other'
  timestamp: string
}

const FormChat: React.FC<FormChatProps> = ({ chatId, partnerOut, socket }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(new Audio(MessageSound))
  useEffect(() => {
    if (!socket) return

    const handleTextMessage = (data: { text: string; sender?: 'other' }) => {
      setMessages((prev) => [
        ...prev,
        {
          type: 'text',
          content: data.text,
          sender: 'other',
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
      audioRef.current.play().catch(() => {})
    }

    const handleImageMessage = (data: { base64: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          type: 'image',
          content: data.base64,
          sender: 'other',
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    }

    const handlePartnerDisconnected = () => {
      toast('คู่ของคุณออกจากห้องแล้ว 👋')
      partnerOut()
      setMessages([])
    }

    socket.on('message', handleTextMessage)
    socket.on('image', handleImageMessage)
    socket.on('partner_disconnected', handlePartnerDisconnected)

    return () => {
      socket.off('message', handleTextMessage)
      socket.off('image', handleImageMessage)
      socket.off('partner_disconnected', handlePartnerDisconnected)
    }
  }, [socket])

  const handleSendText = () => {
    if (!input.trim()) return
    socket.emit('message', { text: input })
    setMessages((prev) => [
      ...prev,
      {
        type: 'text',
        content: input,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
    setInput('')
  }

  const handleSendImage = (file: File, inputEl?: HTMLInputElement) => {
    const maxSize = 2 * 1024 * 1024

    if (file.size > maxSize) {
      toast.error('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 2MB ❌')
      if (inputEl) inputEl.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      socket.emit('image', { base64 })
      setMessages((prev) => [
        ...prev,
        {
          type: 'image',
          content: base64,
          sender: 'me',
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-800">
      <div className="flex justify-between border-b border-gray-800 p-3 text-center font-semibold text-pink-400">
        <div>Chat ID: {chatId}</div>
        <div
          onClick={() => {
            socket.emit('disconnect_room')
            partnerOut()
          }}
          className="flex cursor-pointer rounded bg-red-500 px-2"
        >
          <button className="w-full cursor-pointer text-white">
            Disconnect
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender === 'me' ? 'rounded-br-none bg-pink-600 text-white' : 'rounded-bl-none bg-gray-800 text-gray-300'}`}
            >
              {msg.type === 'text' ? (
                <>
                  <div>{msg.content}</div>
                  <div
                    className={`mt-1 ${msg.sender === 'me' ? 'text-white' : 'text-gray-400'} text-right text-xs`}
                  >
                    {msg.timestamp}
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={msg.content}
                    alt="sent"
                    className="max-w-full rounded"
                  />
                  <div className="mt-1 text-right text-xs text-gray-400">
                    {msg.timestamp}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 border-t border-gray-800 p-3">
        <label className="flex cursor-pointer items-center justify-center rounded-full bg-gray-700 px-3 py-2 hover:bg-gray-600">
          <Image />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] &&
              handleSendImage(e.target.files[0], e.target)
            }
          />
        </label>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
          className="flex-1 rounded-full bg-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:outline-none"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSendText}
          className="rounded-full bg-pink-600 px-4 py-2 transition hover:cursor-pointer hover:bg-pink-500"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default FormChat
