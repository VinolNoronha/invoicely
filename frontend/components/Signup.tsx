import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle } from "@/lib/actions";
import google from "@/public/google.png";
import Image from "next/image";

export default function CardDemo() {
  return (
    <Card className="w-full max-w-xs sm:max-w-sm border-gray-200">
      <CardHeader>
        <CardTitle>Welcome to Invoicely</CardTitle>
        <CardDescription>Enter your email below to sign up</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input id="password" type="password" required />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full bg-black text-white">
          Sign up
        </Button>
        <span className="py-2 text-gray-500 text-sm">or</span>
        <form action={signInWithGoogle} className="w-full">
          <Button variant="secondary" className="w-full">
            <Image src={google} height={15} width={15} alt="google logo" />
            Sign up with Google
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
