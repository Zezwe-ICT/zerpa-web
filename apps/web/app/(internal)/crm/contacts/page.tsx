/**
 * @file app/(internal)/crm/contacts/page.tsx
 * @description CRM contacts page. Server-fetches all contacts via getContacts()
 * and passes them to ContactsListClient for search and display.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContactsListClient } from "@/components/modules/crm/contacts-list-client";
import { getContacts } from "@/lib/data/crm";

export const metadata = {
  title: "Contacts - CRM",
  description: "Manage your business contacts",
};

export default async function ContactsPage() {
  const contacts = await getContacts();

  return (
    <PageContainer>
      <div className="mb-8">
        <PageHeader
          title="Contacts"
          subtitle="Manage all your business contacts and relationships"
        />
      </div>

      <ContactsListClient initialContacts={contacts} />
    </PageContainer>
  );
}
