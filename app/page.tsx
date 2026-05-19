"use client"

import { useEffect, useState } from "react"


interface Teacher {
  id: number
  teacherName: string
  experience?: number
  status?: string
}



export default function TeacherStats() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [notices, setNotices] = useState<any[]>([])
  const [gallery, setGallery] = useState<any[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/teachers")
        const data = await res.json()
        setTeachers(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])



  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/notices")
        const data = await res.json()
        setNotices(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])



  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/gallery")
        const data = await res.json()
        setGallery(data.data || [])
        // console.log(data.data)      //debug
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])





  if (loading) {
    return <p className="text-gray-500">Loading stats...</p>
  }

  const totalTeachers = teachers.length

  const activeTeachers = teachers.filter(
    (t) => t.status === "Active" || !t.status
  ).length




  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

      {/* Total Teachers */}
      <div className="bg-white p-4 rounded-xl shadow border">
        <h2 className="text-mm text-gray-500">Total Teachers</h2>
        <p className="text-2xl font-bold">{totalTeachers}</p>
      </div>

      {/* Active Teachers */}
      <div className="bg-green-50 p-4 rounded-xl shadow border">
        <h2 className="text-md text-green-600">Active Teachers</h2>
        <p className="text-2xl font-bold text-green-700">{activeTeachers}</p>
      </div>

      {/* Notices */}
      <div className="bg-pink-100 p-4 rounded-xl shadow border">
        <h2 className="text-md text-green-600">Notices</h2>
        <p className="text-2xl font-bold text-green-700">{notices.length}</p>
      </div>

      {/* Images */}
      <div className="bg-blue-50 p-4 rounded-xl shadow border">
        <h2 className="text-md text-green-600">Gallery Images</h2>
        <p className="text-2xl font-bold text-green-700">{gallery.length}</p>
      </div>

      {/* Average Experience */}
      {/* <div className="bg-amber-50 p-4 rounded-xl shadow border italic">
        Comming soon
      </div> */}

    </div>
  )
}