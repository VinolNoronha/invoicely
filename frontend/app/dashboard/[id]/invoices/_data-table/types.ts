export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "success";
  email: string;
  customer: string;
  date: string;
  pfp?: string;
};
