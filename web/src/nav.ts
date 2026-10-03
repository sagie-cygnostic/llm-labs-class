import { useLocation } from "react-router-dom";

export function useMock(): boolean {
  const { search } = useLocation();
  return new URLSearchParams(search).get("mock") === "1";
}

export function useTo(): (path: string) => string {
  const mock = useMock();
  return (path: string) => {
    if (!mock) return path;
    const [pathname, query] = path.split("?");
    const params = new URLSearchParams(query ?? "");
    params.set("mock", "1");
    return `${pathname}?${params.toString()}`;
  };
}
