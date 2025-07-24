import React from "react";
import UserList from "./ui/UserList";

const userData = [
  {
    pfp: "",
    username: "Vinol Noronha",
    email: "vinolnoronha@gmail.com",
    amount: "10000",
  },
  {
    pfp: "",
    username: "Jay Shankar",
    email: "jay@gmail.com",
    amount: "2000",
  },
  {
    pfp: "",
    username: "Jyoti Shah",
    email: "jyoti@gmail.com",
    amount: "2399",
  },
  {
    pfp: "",
    username: "Shwetha Shet",
    email: "swetha@gmail.com",
    amount: "6000",
  },
  {
    pfp: "",
    username: "Ankur Bhansal",
    email: "ankur@gmail.com",
    amount: "6000",
  },
];

export default function TopCustomers() {
  return (
    <div className="bg-white mx-3 px-5 my-2 h-full rounded-sm">
      {userData.map((curr, ind) => {
        return <UserList key={curr.email} ind={ind} userData={curr} />;
      })}
    </div>
  );
}
