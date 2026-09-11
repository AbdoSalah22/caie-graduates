import fs from "node:fs";
import path from "node:path";
import { companySlug } from "@/lib/constants";
import PreviewCompanyView from "@/components/PreviewCompanyView";

type PreviewCompanyParams = { name: string };

interface CompanyFile {
  companies: { id: string }[];
}

function loadCompanies(): CompanyFile {
  const filePath = path.join(
    process.cwd(),
    "public",
    "preview-data",
    "companies.json",
  );
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as CompanyFile;
}

const companies = loadCompanies();
const slugToName = new Map<string, string>(
  companies.companies.map((c) => [companySlug(c.id), c.id]),
);

export function generateStaticParams(): PreviewCompanyParams[] {
  return companies.companies.map((c) => ({ name: companySlug(c.id) }));
}

export default function PreviewCompanyPage({
  params,
}: {
  params: PreviewCompanyParams;
}) {
  const companyName = slugToName.get(params.name) ?? params.name;
  return <PreviewCompanyView name={companyName} />;
}