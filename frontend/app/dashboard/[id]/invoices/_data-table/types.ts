export type Payment = {
  id: string;
  amount: number;
  status: boolean;
  email: string | null;
  customer: string;
  date: string;
  pfp?: string | null;
};
