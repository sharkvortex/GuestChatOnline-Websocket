import { useState, useEffect, useRef } from 'react'
import ButtonRandom from '@components/ButtonRandom'
import Header from '@components/Header'
import FormChat from '@components/FormChat'
import { io, Socket } from 'socket.io-client'

const MainPage: React.FC = () => {
  const [chatId, setChatId] = useState<string>('')
  const [isMatching, setIsMatching] = useState<boolean>(false)

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    socketRef.current = io('http://localhost:3001')

    socketRef.current.on('waiting', () => setIsMatching(true))
    socketRef.current.on('connected', (data: { chatId: string }) => {
      setIsMatching(false)
      setChatId(data.chatId)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  const randomChat = () => {
    setIsMatching(true)
    setChatId('')
    socketRef.current?.emit('random')
  }

  return (
    <>
      <Header />
      <main className="flex w-full justify-center px-2 text-white">
        {isMatching && !chatId ? (
          <div className="flex h-[90vh] flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
            <p className="animate-pulse text-lg font-medium text-pink-400">
              Matching someone for you...
            </p>
          </div>
        ) : chatId ? (
          <FormChat
            chatId={chatId}
            partnerOut={() => setChatId('')}
            socket={socketRef.current!}
          />
        ) : (
          <div className="flex h-[90vh] w-full items-center justify-center">
            <ButtonRandom onClick={randomChat} />
          </div>
        )}
      </main>
    </>
  )
}

export default MainPage
