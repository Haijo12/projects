// Icon system — thin adapter over lucide-react.
//
// Rules:
// - Every icon has a controlled size (lucide default 24) — never `100%`.
// - Global CSS (global.css) pins svg defaults; components override via the
//   `size` prop or size utility classes (.icon-sm/.icon-lg), never raw CSS.
// - Pin/Star support `filled` for active states.
import {
  Search,
  Settings,
  ArrowLeft,
  Plus,
  MoreVertical,
  Trash2,
  Archive,
  Star as StarLucide,
  Pin as PinLucide,
  RotateCcw,
  Copy,
  PenLine,
  FileText,
  Check,
  Loader2,
  X,
  Download,
  Upload,
  Eye,
  Link as LinkLucide,
  Link2,
  List,
  ListChecks,
  Quote,
  AtSign,
  ChevronDown,
  ChevronRight,
  Command,
} from "lucide-react";

export {
  Search,
  Settings,
  ArrowLeft,
  Plus,
  MoreVertical,
  Trash2,
  Archive,
  PenLine,
  FileText,
  Check,
  Loader2,
  X,
  Download,
  Upload,
  Eye,
  Link2,
  List,
  ListChecks,
  Quote,
  AtSign,
  ChevronDown,
  ChevronRight,
  Command,
};

const filledProps = (filled) => (filled ? { fill: "currentColor" } : {});

export const PinIcon = ({ filled = false, size = 24, ...p }) => (
  <PinLucide size={size} {...filledProps(filled)} {...p} />
);

export const StarIcon = ({ filled = false, size = 24, ...p }) => (
  <StarLucide size={size} {...filledProps(filled)} {...p} />
);

export const BackIcon = ({ size = 24, ...p }) => <ArrowLeft size={size} {...p} />;
export const MoreIcon = ({ size = 24, ...p }) => <MoreVertical size={size} {...p} />;
export const SearchIcon = ({ size = 24, ...p }) => <Search size={size} {...p} />;
export const CloseIcon = ({ size = 24, ...p }) => <X size={size} {...p} />;
export const PlusIcon = ({ size = 24, ...p }) => <Plus size={size} {...p} />;
export const SettingsIcon = ({ size = 24, ...p }) => <Settings size={size} {...p} />;
export const TrashIcon = ({ size = 24, ...p }) => <Trash2 size={size} {...p} />;
export const RestoreIcon = ({ size = 24, ...p }) => <RotateCcw size={size} {...p} />;
export const ArchiveIcon = ({ size = 24, ...p }) => <Archive size={size} {...p} />;
export const DuplicateIcon = ({ size = 24, ...p }) => <Copy size={size} {...p} />;
export const EditIcon = ({ size = 24, ...p }) => <PenLine size={size} {...p} />;
export const ExportIcon = ({ size = 24, ...p }) => <Download size={size} {...p} />;
export const CheckIcon = ({ size = 24, ...p }) => <Check size={size} {...p} />;
export const NoteIcon = ({ size = 24, ...p }) => <FileText size={size} {...p} />;
export const CommandIcon = ({ size = 24, ...p }) => <Command size={size} {...p} />;
export const WikiIcon = ({ size = 24, ...p }) => <Link2 size={size} {...p} />;
export const ListIcon = ({ size = 24, ...p }) => <List size={size} {...p} />;
export const ChecklistIcon = ({ size = 24, ...p }) => <ListChecks size={size} {...p} />;
export const QuoteIcon = ({ size = 24, ...p }) => <Quote size={size} {...p} />;
export const AtIcon = ({ size = 24, ...p }) => <AtSign size={size} {...p} />;
export const LinkIcon = ({ size = 24, ...p }) => <LinkLucide size={size} {...p} />;
export const ChevronDownIcon = ({ size = 24, ...p }) => <ChevronDown size={size} {...p} />;
export const ChevronRightIcon = ({ size = 24, ...p }) => <ChevronRight size={size} {...p} />;
