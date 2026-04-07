import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Mail, Phone, Briefcase } from "lucide-react";

export const metadata = {
  title: "HR - Zerpa",
  description: "Human resources management",
};

const MOCK_EMPLOYEES = [
  {
    id: "e-001",
    firstName: "Jane",
    lastName: "Doe",
    role: "Sales Agent",
    department: "Operations",
    email: "agent@zerpa.co.za",
    phone: "+27 82 111 2222",
    status: "ACTIVE",
    startDate: "2023-03-01",
  },
  {
    id: "e-002",
    firstName: "Michael",
    lastName: "Smith",
    role: "Account Manager",
    department: "Sales",
    email: "michael@zerpa.co.za",
    phone: "+27 83 333 4444",
    status: "ACTIVE",
    startDate: "2023-06-15",
  },
  {
    id: "e-003",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "Support Specialist",
    department: "Customer Success",
    email: "sarah@zerpa.co.za",
    phone: "+27 84 555 6666",
    status: "ACTIVE",
    startDate: "2024-01-10",
  },
  {
    id: "e-004",
    firstName: "David",
    lastName: "Nkosi",
    role: "Developer",
    department: "Engineering",
    email: "david@zerpa.co.za",
    phone: "+27 85 777 8888",
    status: "ACTIVE",
    startDate: "2024-04-01",
  },
];

export default function HRPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Human Resources"
        subtitle={`${MOCK_EMPLOYEES.length} employees`}
      />

      <div className="grid grid-cols-1 gap-4">
        {MOCK_EMPLOYEES.map((emp) => (
          <div
            key={emp.id}
            className="rounded-[12px] border border-border bg-background p-5 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-fg flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {emp.firstName[0]}{emp.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">
                    {emp.firstName} {emp.lastName}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-fg mb-2">
                  <Briefcase size={12} />
                  {emp.role} · {emp.department}
                </div>
                <div className="flex flex-wrap gap-4">
                  <a
                    href={`mailto:${emp.email}`}
                    className="flex items-center gap-1.5 text-xs text-muted-fg hover:text-primary"
                  >
                    <Mail size={12} />
                    {emp.email}
                  </a>
                  <a
                    href={`tel:${emp.phone}`}
                    className="flex items-center gap-1.5 text-xs text-muted-fg hover:text-primary"
                  >
                    <Phone size={12} />
                    {emp.phone}
                  </a>
                </div>
                <p className="text-xs text-muted-fg mt-2">
                  Joined {new Date(emp.startDate).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
            <StatusBadge status={emp.status} />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
