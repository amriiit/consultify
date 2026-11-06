import { useState } from "react";
import { appointmentsApi } from "../api/appointments.api";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import { Workspace } from "../components/layout/Layout";
import { Empty, PageHeader, ResourceState } from "../components/common/UI";
import AppointmentCard from "../components/appointments/AppointmentCard";
export default function Appointments() {
  const { user } = useAuth();
  const advisor = user.role === "ADVISOR";
  const resource = useResource(
    () => appointmentsApi.list(user.role),
    [user.id],
  );
  const [filter, setFilter] = useState("ALL");
  const items = resource.data?.appointments.filter(
    (a) => filter === "ALL" || a.status === filter,
  );
  return (
    <Workspace>
      <PageHeader
        label="Your conversations"
        title={advisor ? "Make time for perspective." : "Your appointments."}
      >
        {advisor
          ? "Review incoming requests and keep each consultation moving."
          : "Follow your requests from the first hello to a completed conversation."}
      </PageHeader>
      <label className="filter-label">
        Show status
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(
            (s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All appointments" : s.toLowerCase()}
              </option>
            ),
          )}
        </select>
      </label>
      <ResourceState resource={resource}>
        {items?.length ? (
          <div className="stack">
            {items.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                advisor={advisor}
                reload={resource.reload}
              />
            ))}
          </div>
        ) : (
          <Empty
            title="Space for your next conversation."
            to={advisor ? "/advisor/profile" : "/advisors"}
            action={advisor ? "View your profile" : "Explore advisors"}
          >
            No appointments{" "}
            {filter === "ALL" ? "yet" : `with ${filter.toLowerCase()} status`}.{" "}
            {advisor
              ? "Your consultation requests will appear here."
              : "Start by finding a financial advisor."}
          </Empty>
        )}
      </ResourceState>
    </Workspace>
  );
}
