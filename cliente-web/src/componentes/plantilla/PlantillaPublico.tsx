import { Outlet } from 'react-router-dom'

export default function PlantillaPublico() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50">
      <Outlet />
    </div>
  )
}
