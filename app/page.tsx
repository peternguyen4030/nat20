import Link from "next/link";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Link href="/login">
        <Button variant="primary" size="lg">
          Login
        </Button>
      </Link>
    </main>
  );
}
