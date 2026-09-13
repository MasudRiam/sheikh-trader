import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardLive } from "@/components/dashboard-live"

export default function Page() {
  return (
    <>
      <DashboardLive />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </>
  )
}
