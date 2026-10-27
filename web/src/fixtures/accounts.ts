import type { UserRole } from "../api/contract";

export interface DemoAccount {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export const demoAccounts: DemoAccount[] = [
  { email: "guard@bu.ac.th", password: "guard1234", displayName: "เจ้าหน้าที่ รปภ. ประตู 1", role: "guard" },
  { email: "student@bumail.net", password: "student1234", displayName: "นักศึกษาทดลอง", role: "student" },
];
