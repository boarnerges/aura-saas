import { Link } from "@/types";
import LinkCard from "@/components/LinkCard";
import { link } from "fs/promises";

export default function Home() {

const mocklinks: Link[] = [
  {
    id: "abc-1",
    title: "My Github",
    url: "https://github.com/boarnerges",
    isActive: true,
  },
  {
    id: "abc-2",
    title: "My LinkedIn",
    url: "https://www.linkedin.com/in/boris-nerges-9a1b4a1b3/",
    isActive: false,
  },
  {
    id: "abc-3",
    title: "My Twitter",
    url: "https://twitter.com/boarnerges",
    isActive: false,
  },
];
return (
  <div className="max-w-xl mx-auto p-8">
    {mocklinks.map((link) => (<LinkCard key={link.id} link={link} />)) }

  </div>)
}
