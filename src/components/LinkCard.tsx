import { Link } from "@/types";

export default function LinkCard({ link }: { link: Link }) {
  const formatUrl = (url: string) => {
    if (!url) return "#";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  return (
    <a
      href={formatUrl(link.url)}
      target="_blank"
      rel="noopener noreferrer"
      className={`block border p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 ${
        link.isActive ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
      }`}
    >
      {link.title}
    </a>
  );
}
