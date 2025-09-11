import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

export default function Testimonies() {
  const [testimonies, setTestimonies] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiFetch<any[]>('/api/admin/content/testimonials')
        setTestimonies(data)
      } catch (e) {
        setTestimonies([])
      }
    }
    fetchData()
  }, [])

  return (
    <section className="bg-gray-100 py-20">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">What People Are Saying</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonies.map((testimony, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <img
                  src={testimony.image}
                  alt={`${testimony.author || testimony.name}'s Avatar`}
                  className="rounded-full mr-4"
                  width={50}
                  height={50}
                />
                <div>
                  <h3 className="font-semibold">{testimony.author || testimony.name}</h3>
                  <p className="text-gray-600">{testimony.role}</p>
                  <div className="text-sm text-gray-500">
                    {testimony.subject && <span className="font-semibold">{testimony.subject}</span>}
                  </div>
                </div>
              </div>
              <p className="text-gray-700">{testimony.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
  