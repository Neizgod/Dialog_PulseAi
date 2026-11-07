import {
  CsvImportLayoutUI,
  type ImportKind,
} from "../../ui/CsvImportLayoutUI/CsvImportLayoutUI";

export const CsvImportLayout = ({ kind = "csv" }: { kind?: ImportKind }) => {
  return <CsvImportLayoutUI kind={kind} />;
};
