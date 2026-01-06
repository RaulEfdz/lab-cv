import { AdminNav } from "./admin-nav"

interface AdminPageWrapperProps {
  children: React.ReactNode
}

export function AdminPageWrapper({ children }: AdminPageWrapperProps) {
  return (
    <div className="min-h-screen relative overflow-hidden min">
      {/* Admin Navigation */}
      <AdminNav />

      {/* Background with gradient mesh */}
      <div className="fixed inset-0 -z-10">
        {/* Base background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-white to-blue-50/50" />

        {/* Large blurred orbs */}
        <div
          className="absolute -top-40 -right-40 w-[800px] h-[800px]"
          style={{
            background: 'radial-gradient(circle, rgba(246, 115, 0, 0.15) 0%, transparent 60%)',
            filter: 'blur(100px)',
          }}
        />
        <div
          className="absolute top-1/3 -left-40 w-[600px] h-[600px]"
          style={{
            background: 'radial-gradient(circle, rgba(74, 144, 217, 0.12) 0%, transparent 60%)',
            filter: 'blur(100px)',
          }}
        />
        <div
          className="absolute -bottom-40 right-1/4 w-[700px] h-[700px]"
          style={{
            background: 'radial-gradient(circle, rgba(123, 179, 224, 0.10) 0%, transparent 60%)',
            filter: 'blur(120px)',
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[500px] h-[500px]"
          style={{
            background: 'radial-gradient(circle, rgba(246, 115, 0, 0.08) 0%, transparent 50%)',
            filter: 'blur(80px)',
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content with padding for navbar - Full Width */}
      <div className="relative z-10 pt-20 ">
        {children}
      </div>
    </div>
  )
}
