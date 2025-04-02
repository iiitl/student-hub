'use client'
import { useEffect, useState } from 'react'

const TestBackend = () => {
  const [data, setData] = useState({ title: '', message: '' })

  useEffect(() => {
    const fetchMessage = async () => {
      const response = await fetch('/api/test-backend', {
        method: 'POST',
      })
      const json = await response.json()
      setData(json)
    }

    fetchMessage()
  }, [])

  return (
    <div className="flex flex-col w-full h-[100vh] justify-center items-center">
      <div className="flex flex-col items-center border-2 border-black">
        <h1 className="text-5xl mb-2">{data.title}</h1>
        <p className="text-9xl">{data.message}</p>
      </div>
    </div>
  )
}

export default TestBackend
