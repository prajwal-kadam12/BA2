
import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { useOrganization } from "@/context/OrganizationContext";
import { useBranding } from "@/hooks/use-branding";
import {
  RotateCcw,
  ArrowUpDown,
  ChevronRight,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  X,
  Copy,
  ChevronUp,
  UserMinus,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  Receipt,
  CreditCard,
  FileCheck,
  Package,
  Truck,
  RefreshCw,
  Wallet,
  BookOpen,
  FolderKanban,
  BadgeIndianRupee,
  Send,
  Bold,
  Italic,
  Underline,
  Printer,
  Download,
  Upload,
  Settings,
  Calendar,
  Link2,
  Clock,
  User,
  Loader2,
  Star,
  MessageSquare
} from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { robustIframePrint } from "@/lib/robust-print";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmailStatementDialog } from "@/components/EmailStatementDialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";

interface CustomerListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status?: string;
  companyName?: string;
  placeOfSupply?: string;
  outstandingReceivables?: number;
  unusedCredits?: number;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  status?: string;
  companyName?: string;
  contactPerson?: string;
  gstin?: string;
  gstTreatment?: string;
  paymentTerms?: string;
  currency?: string;
  businessLegalName?: string;
  placeOfSupply?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  createdAt?: string;
  outstandingReceivables?: number;
  unusedCredits?: number;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: string;
  date: string;
  number: string;
  orderNumber?: string;
  amount: number;
  balance: number;
  status: string;
  referenceNumber?: string;
}

interface SystemMail {
  id: string;
  to: string;
  subject: string;
  description: string;
  sentAt: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  user: string;
  date: string;
  time: string;
}

const formatAddress = (address: any) => {
  if (!address) return ['-'];
  const parts = [address.street, address.city, address.state, address.country, address.pincode].filter(Boolean);
  return parts.length > 0 ? parts : ['-'];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  };
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

const RenderComment = ({ text }: { text: string }) => {
  // Simple markdown-style rendering for bold, italic, and underline
  let parts: (string | JSX.Element)[] = [text];

  // Bold (**text** or __text__)
  const boldRegex = /\*\*(.*?)\*\*|__(.*?)__/g;
  parts = parts.flatMap((part) => {
    if (typeof part !== 'string') return [part];
    const subParts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    while ((match = boldRegex.exec(part)) !== null) {
      if (match.index > lastIndex) {
        subParts.push(part.substring(lastIndex, match.index));
      }
      subParts.push(<strong key={`bold-${match.index}`}>{match[1] || match[2]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < part.length) {
      subParts.push(part.substring(lastIndex));
    }
    return subParts;
  });

  // Italic (*text* or _text_)
  const italicRegex = /\*(.*?)\*|_(.*?)_/g;
  parts = parts.flatMap((part) => {
    if (typeof part !== 'string') return [part];
    const subParts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    while ((match = italicRegex.exec(part)) !== null) {
      if (match.index > lastIndex) {
        subParts.push(part.substring(lastIndex, match.index));
      }
      subParts.push(<em key={`italic-${match.index}`}>{match[1] || match[2]}</em>);
      lastIndex = italicRegex.lastIndex;
    }
    if (lastIndex < part.length) {
      subParts.push(part.substring(lastIndex));
    }
    return subParts;
  });

  return <>{parts}</>;
};

interface CustomerDetailPanelProps {
  customer: CustomerDetail;
  onClose: () => void;
  onEdit: () => void;
  onClone: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

function CustomerDetailPanel({ customer, onClose, onEdit, onClone, onToggleStatus, onDelete }: CustomerDetailPanelProps) {
  const { currentOrganization: currentOrg } = useOrganization();
  const { data: branding } = useBranding();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isDownloading, setIsDownloading] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({
    invoices: [],
    customerPayments: [],
    quotes: [],
    salesOrders: [],
    deliveryChallans: [],
    recurringInvoices: [],
    expenses: [],
    projects: [],
    journals: [],
    bills: [],
    creditNotes: []
  });
  const [mails, setMails] = useState<SystemMail[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    invoices: true,
    customerPayments: true,
    quotes: false,
    salesOrders: false,
    deliveryChallans: false,
    recurringInvoices: false,
    expenses: false,
    projects: false,
    journals: false,
    bills: false,
    creditNotes: false
  });

  const [sectionFilters, setSectionFilters] = useState<Record<string, string>>({
    invoices: 'All',
    customerPayments: 'All',
    quotes: 'All',
    salesOrders: 'All',
    deliveryChallans: 'All',
    recurringInvoices: 'All',
    expenses: 'All',
    projects: 'All',
    journals: 'All',
    bills: 'All',
    creditNotes: 'All'
  });

  const [statementPeriod, setStatementPeriod] = useState("this-month");
  const [statementFilter, setStatementFilter] = useState("all");

  // Email dialog state
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [statementPdfData, setStatementPdfData] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchCustomerData();
  }, [customer.id]);

  const fetchCustomerData = async () => {
    try {
      const [commentsRes, transactionsRes, mailsRes, activitiesRes] = await Promise.all([
        fetch(`/api/customers/${customer.id}/comments`),
        fetch(`/api/customers/${customer.id}/transactions`),
        fetch(`/api/customers/${customer.id}/mails`),
        fetch(`/api/customers/${customer.id}/activities`)
      ]);

      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.data || []);
      }
      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.data || transactions);
      }
      if (mailsRes.ok) {
        const data = await mailsRes.json();
        setMails(data.data || []);
      }
      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isAddingComment) return;
    setIsAddingComment(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment })
      });
      if (response.ok) {
        const data = await response.json();
        setComments([data.data, ...comments]); // Put new comment at the top
        setNewComment("");
        toast({ title: "Comment added successfully" });
      }
    } catch (error) {
      toast({ title: "Failed to add comment", variant: "destructive" });
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/customers/${customer.id}/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId));
        toast({ title: "Comment deleted successfully" });
      }
    } catch (error) {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    }
  };

  const applyFormatting = (format: 'bold' | 'italic' | 'underline') => {
    const textarea = commentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let formattedText = "";
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
    }

    const newValue = text.substring(0, start) + formattedText + text.substring(end);
    setNewComment(newValue);

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };


  const handlePrint = async () => {
    toast({ title: "Preparing print...", description: "Please wait while we generate the statement preview." });
    try {
      await robustIframePrint('customer-statement', `Statement_${customer.name}_${statementPeriod}`);
    } catch (error) {
      console.error('Print failed:', error);
      toast({ title: "Print failed", variant: "destructive" });
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('customer-statement');
    if (!element) return;

    setIsDownloading(true);

    // Create a container for the clone to ensure it renders properly
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.zIndex = '-9999';
    container.style.width = '210mm'; // A4 width
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '0';
    container.style.margin = '0';
    document.body.appendChild(container);

    // Clone the element
    const clone = element.cloneNode(true) as HTMLElement;

    // Optimize clone for PDF
    clone.style.position = 'static';
    clone.style.width = '100%';
    clone.style.height = 'auto';
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.style.overflow = 'visible';
    clone.style.minHeight = '0'; // Fix: Clear possible min-height that could cause overflow

    // Fix table layout to ensure all columns are visible
    const tables = clone.querySelectorAll('table');
    tables.forEach((table: any) => {
      table.style.width = '100%';
      table.style.tableLayout = 'fixed';
      table.style.borderCollapse = 'collapse';
    });

    // Ensure all table cells are visible with proper padding
    const cells = clone.querySelectorAll('td, th');
    cells.forEach((cell: any) => {
      cell.style.overflow = 'visible';
      cell.style.whiteSpace = 'nowrap';
    });

    container.appendChild(clone);

    // Wait longer for layout to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const dataUrl = await toPng(clone, {
        backgroundColor: '#ffffff',
        quality: 0.5, // Reduced quality for smaller file size
        pixelRatio: 1, // Reduced from 2 to 1 for smaller file size
        width: container.offsetWidth,
        height: container.offsetHeight,
        cacheBust: true,
        skipFonts: true, // Skip web fonts to avoid CORS issues
        style: {
          overflow: 'visible',
          width: container.offsetWidth + 'px',
          height: container.offsetHeight + 'px'
        }
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 190; // A4 width minus margins (210mm - 20mm)
      const pageHeight = 277; // A4 height minus margins (297mm - 20mm)
      const elementHeight = container.offsetHeight;
      const elementWidth = container.offsetWidth;
      const imgHeight = (elementHeight * imgWidth) / elementWidth;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 10, 10, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 2) { // 2mm tolerance
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 10, position + 10, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Statement_${customer.name}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Statement downloaded successfully" });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: "Failed to download PDF", variant: "destructive" });
    } finally {
      document.body.removeChild(container);
      setIsDownloading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFilterChange = (sectionKey: string, status: string) => {
    setSectionFilters(prev => ({ ...prev, [sectionKey]: status }));
  };

  const getFilteredTransactions = (sectionKey: string) => {
    const sectionTransactions = transactions[sectionKey] || [];
    const filter = sectionFilters[sectionKey];

    if (filter === 'All') {
      return sectionTransactions;
    }

    return sectionTransactions.filter(tx =>
      tx.status?.toUpperCase() === filter.toUpperCase() ||
      tx.status?.toUpperCase().replace('_', ' ') === filter.toUpperCase()
    );
  };
  const handleNewTransaction = (type: string) => {
    const availableRoutes: Record<string, string> = {
      invoice: `/invoices/create?customerId=${customer.id}`,
      quote: `/quotes/create?customerId=${customer.id}`,
      "sales-order": `/sales-orders/create?customerId=${customer.id}`,
      "delivery-challan": `/delivery-challans/create?customerId=${customer.id}`,
      payment: `/payments-received/create?customerId=${customer.id}`,
      "credit-note": `/credit-notes/create?customerId=${customer.id}`,
      expense: `/expenses?customerId=${customer.id}`,
    };
    const unavailableTypes = ["recurring-invoice", "journal", "project"];

    if (unavailableTypes.includes(type)) {
      toast({
        title: "Feature coming soon",
        description: "This feature is not yet available. Please check back later.",
      });
      return;
    }
    setLocation(availableRoutes[type] || `/invoices/create?customerId=${customer.id}`);
  };

  const transactionSections = [
    { key: 'invoices', label: 'Invoices', columns: ['DATE', 'INVOICE N...', 'ORDER NU...', 'AMOUNT', 'BALANCE D...', 'STATUS'], statusOptions: ['All', 'Draft', 'Pending', 'Paid', 'Partially Paid', 'Overdue', 'Void'] },
    { key: 'customerPayments', label: 'Customer Payments', columns: ['DATE', 'PAYMEN...', 'REFERE...', 'PAYMEN...', 'AMOUNT', 'UNUSED...', 'STATUS'], statusOptions: ['All', 'Draft', 'Sent', 'Partially Paid', 'Paid', 'Refunded'] },
    { key: 'quotes', label: 'Quotes', columns: ['DATE', 'QUOTE N...', 'REFERENCE', 'AMOUNT', 'STATUS'], statusOptions: ['All', 'Draft', 'Sent', 'Accepted', 'Declined', 'Expired'] },
    { key: 'salesOrders', label: 'Sales Orders', columns: ['DATE', 'SO N...', 'REFERENCE', 'AMOUNT', 'STATUS'], statusOptions: ['All', 'Draft', 'Confirmed', 'Closed', 'Cancelled'] },
    { key: 'deliveryChallans', label: 'Delivery Challans', columns: ['DATE', 'CHALLAN N...', 'REFERENCE', 'STATUS'], statusOptions: ['All', 'Draft', 'Delivered', 'Cancelled'] },
    // { key: 'recurringInvoices', label: 'Recurring Invoices', columns: ['PROFILE NAME', 'FREQUENCY', 'LAST INVOICE', 'NEXT INVOICE', 'STATUS'] },
    { key: 'expenses', label: 'Expenses', columns: ['DATE', 'EXPENSE N...', 'CATEGORY', 'AMOUNT', 'STATUS'], statusOptions: ['All', 'Draft', 'Pending', 'Approved', 'Rejected'] },
    // { key: 'projects', label: 'Projects', columns: ['PROJECT NAME', 'BILLING METHOD', 'STATUS'] },
    // { key: 'journals', label: 'Journals', columns: ['DATE', 'JOURNAL N...', 'REFERENCE', 'NOTES'] },
    { key: 'bills', label: 'Bills', columns: ['DATE', 'BILL N...', 'VENDOR', 'AMOUNT', 'STATUS'], statusOptions: ['All', 'Draft', 'Open', 'Paid', 'Overdue', 'Void'] },
    { key: 'creditNotes', label: 'Credit Notes', columns: ['DATE', 'CREDIT NOTE N...', 'AMOUNT', 'BALANCE', 'STATUS'], statusOptions: ['All', 'Draft', 'Open', 'Closed'] }
  ];

  const [statementTransactions, setStatementTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (activeTab === "statement") {
      fetchStatementTransactions();
    }
  }, [activeTab, customer.id]);

  const fetchStatementTransactions = async () => {
    try {
      const response = await fetch(`/api/customers/${customer.id}/transactions`);
      if (response.ok) {
        const data = await response.json();
        // Assuming transactions.invoices and transactions.customerPayments are the source
        const allTx = [
          ...(data.data.invoices || []).map((inv: any) => ({ ...inv, type: 'Invoice' })),
          ...(data.data.customerPayments || []).map((pay: any) => ({ ...pay, type: 'Payment' }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setStatementTransactions(allTx);
      }
    } catch (error) {
      console.error('Error fetching statement transactions:', error);
    }
  };

  const invoicedAmount = statementTransactions
    .filter(tx => tx.type === 'Invoice')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const amountReceived = statementTransactions
    .filter(tx => tx.type === 'Payment' || tx.status === 'PAID' || tx.status === 'PARTIALLY_PAID')
    .reduce((sum, tx) => {
      if (tx.type === 'Payment') return sum + tx.amount;
      // For invoices, the amount received is (total amount - balance)
      return sum + (tx.amount - (tx.balance || 0));
    }, 0);

  const balanceDue = invoicedAmount - amountReceived;

  // Handle open email dialog with PDF generation
  const handleOpenEmailDialog = async () => {
    const element = document.getElementById('customer-statement');
    if (!element) {
      toast({ title: "Error", description: "Statement not found", variant: "destructive" });
      return;
    }

    setIsDownloading(true);
    try {
      console.log('PDF generation started...');
      // Create a container for the clone
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.zIndex = '-9999';
      container.style.width = '210mm';
      container.style.backgroundColor = '#ffffff';
      document.body.appendChild(container);

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'static';
      clone.style.width = '100%';
      clone.style.height = 'auto';
      clone.style.minHeight = '0'; // Fix: Clear possible min-height that could cause overflow

      const tables = clone.querySelectorAll('table');
      tables.forEach((table: any) => {
        table.style.width = '100%';
        table.style.tableLayout = 'fixed';
        table.style.borderCollapse = 'collapse';
      });

      container.appendChild(clone);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const dataUrl = await toPng(clone, {
        backgroundColor: '#ffffff',
        quality: 0.3, // Further reduced quality for speed/size
        pixelRatio: 0.8, // Reduced for faster generation
        width: container.offsetWidth,
        height: container.offsetHeight,
        cacheBust: true,
        skipFonts: true,
        style: {
          overflow: 'visible',
          width: container.offsetWidth + 'px',
          height: container.offsetHeight + 'px'
        }
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 190;
      const pageHeight = 277;
      const elementHeight = container.offsetHeight;
      const elementWidth = container.offsetWidth;
      const imgHeight = (elementHeight * imgWidth) / elementWidth;

      // Use JPEG for smaller file size
      pdf.addImage(dataUrl, 'JPEG', 10, 10, imgWidth, imgHeight, undefined, 'MEDIUM');

      let heightLeft = imgHeight - pageHeight;
      let position = 0;
      while (heightLeft > 2) { // 2mm tolerance
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 10, position + 10, imgWidth, imgHeight, undefined, 'MEDIUM');
        heightLeft -= pageHeight;
      }

      // Convert PDF to base64
      const pdfBase64 = pdf.output('dataurlstring').split(',')[1];
      console.log('PDF generation complete. Base64 length:', pdfBase64.length);
      setStatementPdfData(pdfBase64);

      document.body.removeChild(container);
      setIsEmailDialogOpen(true);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({ title: "Failed to generate PDF", description: error.message, variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle send statement email
  const handleSendStatementEmail = async (emailData: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    pdfData?: string;
  }) => {
    try {
      console.log('Sending statement email to:', emailData.to);
      const response = await fetch(`/api/customers/${customer.id}/statement/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          body: emailData.body,
          pdfData: emailData.pdfData,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send email';
        try {
          // Use clone to avoid "body disturbed" error if we need to read it multiple ways
          const clonedResponse = response.clone();
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = await clonedResponse.text() || errorMessage;
          }
        } catch (e) {
          errorMessage = 'Server error occurred';
        }
        throw new Error(errorMessage);
      }

      toast({ title: "Email sent successfully" });

      // Refresh mails to show the sent email
      fetchCustomerData();
    } catch (error: any) {
      console.error('Error sending statement email:', error);
      toast({
        title: "Error sending email",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white truncate" data-testid="text-customer-name">{customer.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} data-testid="button-edit-customer">
            Edit
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <FileText className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5" size="sm" data-testid="button-new-transaction">
                New Transaction
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-slate-500">SALES</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleNewTransaction("invoice")} data-testid="menu-item-invoice">
                <Receipt className="mr-2 h-4 w-4" /> Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNewTransaction("payment")} data-testid="menu-item-payment">
                <CreditCard className="mr-2 h-4 w-4" /> Customer Payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNewTransaction("quote")} data-testid="menu-item-quote">
                <FileCheck className="mr-2 h-4 w-4" /> Quote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNewTransaction("sales-order")} data-testid="menu-item-sales-order">
                <Package className="mr-2 h-4 w-4" /> Sales Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNewTransaction("delivery-challan")} data-testid="menu-item-delivery-challan">
                <Truck className="mr-2 h-4 w-4" /> Delivery Challan
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => handleNewTransaction("recurring-invoice")} data-testid="menu-item-recurring-invoice">
              <RefreshCw className="mr-2 h-4 w-4" /> Recurring Invoice
            </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNewTransaction("expense")} data-testid="menu-item-expense">
                <Wallet className="mr-2 h-4 w-4" /> Expense
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => handleNewTransaction("journal")} data-testid="menu-item-journal">
              <BookOpen className="mr-2 h-4 w-4" /> Journal
            </DropdownMenuItem> */}
              <DropdownMenuItem onClick={() => handleNewTransaction("credit-note")} data-testid="menu-item-credit-note">
                <BadgeIndianRupee className="mr-2 h-4 w-4" /> Credit Note
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => handleNewTransaction("project")} data-testid="menu-item-project">
              <FolderKanban className="mr-2 h-4 w-4" /> Project
            </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-more-options">
                More
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onClone} data-testid="menu-item-clone">
                <Copy className="mr-2 h-4 w-4" /> Clone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleStatus} data-testid="menu-item-toggle-status">
                {customer.status === "active" ? (
                  <><UserMinus className="mr-2 h-4 w-4" /> Mark as Inactive</>
                ) : (
                  <><UserCheck className="mr-2 h-4 w-4" /> Mark as Active</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive" data-testid="menu-item-delete">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} data-testid="button-close-panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <TabsList className="h-auto p-0 bg-transparent gap-6">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
              data-testid="tab-overview"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
              data-testid="tab-comments"
            >
              Comments
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
              data-testid="tab-transactions"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="mails"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
              data-testid="tab-mails"
            >
              Mails
            </TabsTrigger>
            <TabsTrigger
              value="statement"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
              data-testid="tab-statement"
            >
              Statement
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 overflow-auto scrollbar-hide mt-0">
          <div className="flex h-full">
            <div className="w-72 border-r border-slate-200 dark:border-slate-700 p-6 overflow-auto scrollbar-hide">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{customer.name}</h3>
                  {customer.contactPerson && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{customer.contactPerson}</p>
                        <p className="text-xs text-blue-600">{customer.email}</p>
                      </div>
                    </div>
                  )}
                  {!customer.contactPerson && customer.email && (
                    <p className="text-sm text-blue-600 mt-2">{customer.email}</p>
                  )}
                  <button className="text-sm text-blue-600 mt-1">Invite to Portal</button>
                </div>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-slate-500">
                    ADDRESS
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Billing Address</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-sm mt-1">
                        {formatAddress(customer.billingAddress).map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Shipping Address</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-sm mt-1">
                        {formatAddress(customer.shippingAddress).map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                    <button className="text-sm text-blue-600">Add additional address</button>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-slate-500">
                    OTHER DETAILS
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="text-slate-500">Customer Type</p>
                      <p className="font-medium">Business</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Default Currency</p>
                      <p className="font-medium">{customer.currency || 'INR'}</p>
                    </div>
                    {customer.businessLegalName && (
                      <div>
                        <p className="text-slate-500">Business Legal Name</p>
                        <p className="font-medium">{customer.businessLegalName}</p>
                      </div>
                    )}
                    {customer.gstTreatment && (
                      <div>
                        <p className="text-slate-500">GST Treatment</p>
                        <p className="font-medium">{customer.gstTreatment}</p>
                      </div>
                    )}
                    {customer.gstin && (
                      <div>
                        <p className="text-slate-500">GSTIN</p>
                        <p className="font-medium">{customer.gstin}</p>
                      </div>
                    )}
                    {customer.placeOfSupply && (
                      <div>
                        <p className="text-slate-500">Place of Supply</p>
                        <p className="font-medium">{customer.placeOfSupply}</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-hide">
              <div className="w-full">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 mx-6 mt-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    You can request your contact to directly update the GSTIN by sending an email.{' '}
                    <button className="text-blue-600 font-medium">Send email</button>
                  </p>
                </div>

                <div className="mb-6 mx-6">
                  <p className="text-sm text-slate-500">Payment due period</p>
                  <p className="text-sm font-medium">{customer.paymentTerms || 'Due on Receipt'}</p>
                </div>

                <div className="mb-6 mx-6">
                  <h4 className="text-lg font-semibold mb-4">Receivables</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b">
                        <th className="py-2">CURRENCY</th>
                        <th className="py-2 text-right">OUTSTANDING RECEIVABLES</th>
                        <th className="py-2 text-right">UNUSED CREDITS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2">INR- Indian Rupee</td>
                        <td className="py-2 text-right">{formatCurrency(customer.outstandingReceivables || 0)}</td>
                        <td className="py-2 text-right">{formatCurrency(customer.unusedCredits || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <button className="text-sm text-blue-600 mt-2">Enter Opening Balance</button>
                </div>

                <div className="mb-6 mx-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Income</h4>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="last-6-months">
                        <SelectTrigger className="w-36 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                          <SelectItem value="last-12-months">Last 12 Months</SelectItem>
                          <SelectItem value="this-year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="accrual">
                        <SelectTrigger className="w-28 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accrual">Accrual</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">This chart is displayed in the organization's base currency.</p>
                  <div className="h-32 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-end justify-around px-4 pb-2">
                    {['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((month, i) => (
                      <div key={month} className="flex flex-col items-center">
                        <div className="w-8 bg-blue-200 dark:bg-blue-800 rounded-t" style={{ height: `${20 + i * 10}px` }}></div>
                        <span className="text-xs text-slate-500 mt-1">{month}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm mt-4">Total Income ( Last 6 Months ) - {formatCurrency(0)}</p>
                </div>

                <div className="mx-6 pb-6">
                  <h4 className="text-lg font-semibold mb-4">Activity Timeline</h4>
                  <div className="space-y-4">
                    {activities.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No activities yet</p>
                      </div>
                    ) : (
                      activities.map((activity) => {
                        const { date, time } = formatDateTime(activity.date);
                        return (
                          <div key={activity.id} className="flex gap-4">
                            <div className="text-right text-xs text-slate-500 w-24 flex-shrink-0">
                              <p>{date}</p>
                              <p>{time}</p>
                            </div>
                            <div className="relative">
                              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-blue-200"></div>
                              <div className="relative z-10 h-4 w-4 bg-white border-2 border-blue-500 rounded"></div>
                            </div>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                              <h5 className="font-medium text-sm">{activity.title}</h5>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{activity.description}</p>
                              <p className="text-xs text-slate-500 mt-2">
                                by <span className="text-blue-600">{activity.user}</span>
                                {activity.type === 'invoice' && (
                                  <button className="text-blue-600 ml-2">- View Details</button>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="flex-1 overflow-auto scrollbar-hide mt-0">
          <div className="w-full p-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden mb-8 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
              <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => applyFormatting('bold')}
                  title="Bold (**text**)"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => applyFormatting('italic')}
                  title="Italic (*text*)"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => applyFormatting('underline')}
                  title="Underline (__text__)"
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                ref={commentRef}
                placeholder="Write a comment... (Markdown supported)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="border-0 focus-visible:ring-0 min-h-32 resize-none p-4 text-sm bg-transparent"
                data-testid="input-comment"
              />
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isAddingComment}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 shadow-sm shadow-blue-500/20"
                  data-testid="button-add-comment"
                >
                  {isAddingComment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : "Add Comment"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">All Comments</h4>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            {comments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No comments yet.</p>
                <p className="text-xs text-slate-400 mt-1">Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                          {comment.author.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{comment.author}</p>
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(comment.createdAt).date} at {formatDateTime(comment.createdAt).time}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleDeleteComment(comment.id)}
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-11">
                      <RenderComment text={comment.text} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="flex-1 overflow-auto scrollbar-hide mt-0" data-transactions-scroll-container>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-goto-transactions">
                    Go to transactions
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {transactionSections.map((section) => (
                    <DropdownMenuItem
                      key={section.key}
                      onClick={() => {
                        // First expand the section
                        setExpandedSections(prev => ({ ...prev, [section.key]: true }));
                        // Use a slightly longer timeout to allow the section to expand fully
                        setTimeout(() => {
                          const element = document.getElementById(`section-${section.key}`);
                          const scrollContainer = document.querySelector('[data-transactions-scroll-container]');
                          if (element && scrollContainer) {
                            // Get the parent container's padding/offset (the div with p-6 = 24px)
                            const containerPadding = 24;
                            // Calculate scroll position - element's position relative to container
                            const elementTop = element.offsetTop;

                            scrollContainer.scrollTo({
                              top: elementTop - containerPadding - 60, // 60px offset for the dropdown header
                              behavior: 'smooth'
                            });
                          } else if (element) {
                            // Fallback to scrollIntoView if container not found
                            element.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start'
                            });
                          }
                        }, 300);
                      }}
                    >
                      {section.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-4">
              {transactionSections.map((section) => (
                <Collapsible
                  key={section.key}
                  open={expandedSections[section.key]}
                  onOpenChange={() => toggleSection(section.key)}
                >
                  <div id={`section-${section.key}`} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div className="flex items-center gap-2">
                        {expandedSections[section.key] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{section.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div
                              className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-slate-700"
                            >
                              <Filter className="h-4 w-4" />
                              Status: {sectionFilters[section.key]}
                              <ChevronDown className="h-3 w-3" />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {section.statusOptions?.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFilterChange(section.key, status);
                                }}
                                className={sectionFilters[section.key] === status ? 'bg-blue-50 text-blue-600' : ''}
                              >
                                {status}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNewTransaction(section.key === 'customerPayments' ? 'payment' : section.key.slice(0, -1));
                          }}
                          data-testid={`button-new-${section.key}`}
                        >
                          <Plus className="h-3 w-3" />
                          New
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                              {section.columns.map((col, i) => (
                                <th key={i} className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(getFilteredTransactions(section.key) || []).length === 0 ? (
                              <tr>
                                <td colSpan={section.columns.length} className="px-4 py-8 text-center text-slate-500">
                                  No {section.label.toLowerCase()} found. <button className="text-blue-600" onClick={() => handleNewTransaction(section.key === 'customerPayments' ? 'payment' : section.key.slice(0, -1))}>Add New</button>
                                </td>
                              </tr>
                            ) : (
                              (getFilteredTransactions(section.key) || []).map((tx) => (
                                <tr key={tx.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                                  <td className="px-4 py-3">{formatDate(tx.date)}</td>
                                  <td className="px-4 py-3 text-blue-600">{tx.number}</td>
                                  <td className="px-4 py-3">{tx.orderNumber || '-'}</td>
                                  <td className="px-4 py-3">{formatCurrency(tx.amount)}</td>
                                  <td className="px-4 py-3">{formatCurrency(tx.balance)}</td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className={tx.status === 'Draft' ? 'text-slate-500' : 'text-green-600'}>
                                      {tx.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mails" className="flex-1 overflow-auto scrollbar-hide p-6 mt-0">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-medium">System Mails</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-link-email">
                  <Link2 className="h-4 w-4" />
                  Link Email account
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Gmail</DropdownMenuItem>
                <DropdownMenuItem>Outlook</DropdownMenuItem>
                <DropdownMenuItem>Other</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {mails.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium mb-1">No emails yet</p>
              <p className="text-sm">System emails sent to this customer will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mails.map((mail) => {
                const { date, time } = formatDateTime(mail.sentAt);
                return (
                  <div key={mail.id} className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-medium">R</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">To <span className="text-blue-600">{mail.to}</span></p>
                      <p className="font-medium text-sm mt-1">{mail.subject}</p>
                      <p className="text-sm text-slate-500 truncate">{mail.description}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500 flex-shrink-0">
                      <p>{date}</p>
                      <p>{time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="statement" className="flex-1 overflow-hidden mt-0">
          <div className="h-full overflow-auto scrollbar-hide p-4 md:p-8 flex flex-col items-center bg-slate-100 dark:bg-slate-800">
            {/* Statement Options Bar */}
            <div className="w-full max-w-[210mm] mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Select value={statementPeriod} onValueChange={setStatementPeriod}>
                  <SelectTrigger className="h-9 min-w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" data-testid="select-period">
                    <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-quarter">This Quarter</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statementFilter} onValueChange={setStatementFilter}>
                  <SelectTrigger className="h-9 min-w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600" data-testid="select-filter">
                    <span className="mr-1 text-slate-400">Filter By:</span>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="outstanding">Outstanding</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900" onClick={handlePrint} title="Print" data-testid="button-print">
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900" onClick={handleDownloadPDF} disabled={isDownloading} title="Download PDF" data-testid="button-download-pdf">
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900" title="Download Excel" data-testid="button-download-excel">
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  className="h-9 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all gap-2"
                  size="sm"
                  data-testid="button-send-email"
                  onClick={handleOpenEmailDialog}
                  disabled={isDownloading}
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send Email
                </Button>
              </div>
            </div>

            <div
              id="customer-statement"
              className="bg-white dark:bg-white text-slate-900 shadow-xl px-8 md:px-10 py-10 w-full max-w-[210mm] min-h-[296mm] h-fit"
              style={{ color: '#000000' }}
            >
              {/* Branding Header */}
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-4">
                  {branding?.logo?.url && (
                    <img src={branding.logo.url} alt="Logo" className="h-16 object-contain" />
                  )}
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold uppercase">{currentOrg?.name}</h2>
                    <p className="text-sm text-slate-600">{currentOrg?.street1}</p>
                    {currentOrg?.street2 && <p className="text-sm text-slate-600">{currentOrg.street2}</p>}
                    <p className="text-sm text-slate-600">
                      {[currentOrg?.city, currentOrg?.state, currentOrg?.postalCode].filter(Boolean).join(', ')}
                    </p>
                    {currentOrg?.gstin && <p className="text-sm font-semibold pt-1">GSTIN: {currentOrg.gstin}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-light text-slate-400 uppercase tracking-widest mb-4">Statement</h1>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-slate-400 uppercase">Date:</span> {formatDate(new Date().toISOString())}</p>
                    <p><span className="text-slate-400 uppercase">Period:</span> 01/12/2025 TO 31/12/2025</p>
                  </div>
                </div>
              </div>

              {/* Address Grid */}
              <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">To</h3>
                  <div className="space-y-1">
                    <p className="font-bold text-blue-600 text-lg leading-none mb-1">{customer.name}</p>
                    {customer.companyName && <p className="font-bold text-sm text-slate-800">{customer.companyName}</p>}
                    {formatAddress(customer.billingAddress).map((part, i) => (
                      <p key={i} className="text-sm text-slate-600">{part}</p>
                    ))}
                    {customer.gstin && <p className="text-sm font-semibold pt-1">GSTIN: {customer.gstin}</p>}
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-sm border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Account Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Opening Balance</span>
                      <span className="font-medium">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Invoiced Amount</span>
                      <span className="font-medium">{formatCurrency(invoicedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Amount Received</span>
                      <span className="font-medium text-green-600">{formatCurrency(amountReceived)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between">
                      <span className="font-bold uppercase text-xs">Balance Due</span>
                      <span className="font-bold text-lg">{formatCurrency(balanceDue)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-12">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '40%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider">Transactions</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider">Payments</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statementTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">No transactions in this period</td>
                      </tr>
                    ) : (
                      statementTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 text-xs">{formatDate(tx.date)}</td>
                          <td className="px-4 py-4">
                            <p className="text-xs font-bold">{tx.type} {tx.number}</p>
                            {tx.referenceNumber && <p className="text-[10px] text-slate-400">Ref: {tx.referenceNumber}</p>}
                          </td>
                          <td className="px-4 py-4 text-xs text-right">
                            {tx.type === 'Invoice' ? formatCurrency(tx.amount) : '—'}
                          </td>
                          <td className="px-4 py-4 text-xs text-right text-green-600">
                            {tx.type === 'Payment' || (tx.amount - (tx.balance || 0) > 0) ?
                              formatCurrency(tx.type === 'Payment' ? tx.amount : (tx.amount - (tx.balance || 0))) :
                              '—'
                            }
                          </td>
                          <td className="px-4 py-4 text-xs text-right font-bold">
                            {formatCurrency(tx.balance || 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-900">
                      <td colSpan={4} className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider">Closing Balance</td>
                      <td className="px-4 py-3 text-right text-sm font-black">{formatCurrency(balanceDue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer Branding */}
              <div className="mt-auto pt-12 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <div className="text-[10px] text-slate-400 space-y-1 uppercase tracking-widest font-medium">
                    <p>This is a computer generated statement.</p>
                    <p>Thank you for your business</p>
                  </div>
                  {branding?.signature?.url && (
                    <div className="text-right space-y-2">
                      <img src={branding.signature.url} alt="Signature" className="h-12 ml-auto object-contain" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-200 pt-2 px-4">Authorized Signature</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Email Statement Dialog */}
      <EmailStatementDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        recipient={{
          id: customer.id,
          name: customer.name,
          email: customer.email,
        }}
        organization={{
          name: currentOrg?.name || 'Your Company',
          email: currentOrg?.email || 'noreply@company.com',
        }}
        statementPeriod={statementPeriod}
        pdfData={statementPdfData}
        onSendEmail={handleSendStatementEmail}
      />
    </div>
  );
}

export default function CustomersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [favoriteFilters, setFavoriteFilters] = useState<string[]>([]);

  const CUSTOMER_FILTERS = [
    { id: "all", label: "All Customers" },
    { id: "active", label: "Active Customers" },
    { id: "crm", label: "CRM Customers" },
    { id: "duplicate", label: "Duplicate Customers" },
    { id: "inactive", label: "Inactive Customers" },
    { id: "portal_enabled", label: "Customer Portal Enabled" },
    { id: "portal_disabled", label: "Customer Portal Disabled" },
    { id: "overdue", label: "Overdue Customers" },
    { id: "unpaid", label: "Unpaid Customers" },
  ];

  const getFilterLabel = () => {
    const filter = CUSTOMER_FILTERS.find(f => f.id === activeFilter);
    return filter?.label || "All Customers";
  };

  const toggleFavorite = (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteFilters.includes(filterId)) {
      setFavoriteFilters(favoriteFilters.filter(f => f !== filterId));
    } else {
      setFavoriteFilters([...favoriteFilters, filterId]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/customers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch customer detail:', error);
    }
  };

  const handleCustomerClick = (customer: CustomerListItem) => {
    fetchCustomerDetail(customer.id);
  };

  const handleClosePanel = () => {
    setSelectedCustomer(null);
  };

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setLocation(`/customers/${selectedCustomer.id}/edit`);
    }
  };

  const toggleSelectCustomer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter(i => i !== id));
    } else {
      setSelectedCustomers([...selectedCustomers, id]);
    }
  };

  const handleClone = async () => {
    if (!selectedCustomer) return;
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}/clone`, { method: 'POST' });
      if (response.ok) {
        toast({ title: "Customer cloned successfully" });
        fetchCustomers();
        handleClosePanel();
      }
    } catch (error) {
      toast({ title: "Failed to clone customer", variant: "destructive" });
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedCustomer) return;
    const newStatus = selectedCustomer.status === "active" ? "inactive" : "active";
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        toast({ title: `Customer marked as ${newStatus}` });
        fetchCustomers();
        fetchCustomerDetail(selectedCustomer.id);
      }
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteClick = () => {
    if (selectedCustomer) {
      setCustomerToDelete(selectedCustomer.id);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const response = await fetch(`/api/customers/${customerToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Customer deleted successfully" });
        handleClosePanel();
        fetchCustomers();
      }
    } catch (error) {
      toast({ title: "Failed to delete customer", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const applyFilter = (customerList: CustomerListItem[]) => {
    let filtered = customerList;

    switch (activeFilter) {
      case "active":
        filtered = customerList.filter(c => c.status === "active" || !c.status);
        break;
      case "inactive":
        filtered = customerList.filter(c => c.status === "inactive");
        break;
      case "portal_enabled":
        filtered = customerList.filter(c => (c as any).portalStatus === "enabled");
        break;
      case "portal_disabled":
        filtered = customerList.filter(c => (c as any).portalStatus !== "enabled");
        break;
      case "overdue":
        filtered = customerList.filter(c => (c.outstandingReceivables || 0) > 0);
        break;
      case "unpaid":
        filtered = customerList.filter(c => (c.outstandingReceivables || 0) > 0);
        break;
      case "duplicate":
        const emailCounts: Record<string, number> = {};
        const phoneCounts: Record<string, number> = {};
        customerList.forEach(c => {
          if (c.email) emailCounts[c.email] = (emailCounts[c.email] || 0) + 1;
          if (c.phone) phoneCounts[c.phone] = (phoneCounts[c.phone] || 0) + 1;
        });
        filtered = customerList.filter(c =>
          (c.email && emailCounts[c.email] > 1) ||
          (c.phone && phoneCounts[c.phone] > 1)
        );
        break;
      case "crm":
        filtered = customerList.filter(c => (c as any).source === "crm");
        break;
      default:
        filtered = customerList;
    }

    return filtered;
  };

  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const sortCustomers = (customerList: CustomerListItem[]) => {
    return [...customerList].sort((a, b) => {
      let aValue: any = a[fieldMapping[sortBy] as keyof CustomerListItem] || "";
      let bValue: any = b[fieldMapping[sortBy] as keyof CustomerListItem] || "";

      if (sortBy === "receivables") {
        aValue = a.outstandingReceivables || 0;
        bValue = b.outstandingReceivables || 0;
      }

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const fieldMapping: Record<string, string> = {
    name: "name",
    company: "companyName",
    receivables: "outstandingReceivables",
    created_at: "id", // Assuming ID is sequential or using it as proxy if no createdAt
    last_modified: "id"
  };

  const filteredCustomers = sortCustomers(applyFilter(customers).filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ));

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredCustomers, 10);

  const [importDropdownOpen, setImportDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const checkCompact = () => {
      setIsCompact(window.innerWidth < 1280);
    };

    // Initial check
    checkCompact();

    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup key={`${selectedCustomer ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
        {(!isCompact || !selectedCustomer) && (
          <ResizablePanel
            defaultSize={isCompact ? 100 : (selectedCustomer ? 33 : 100)}
            minSize={isCompact ? 100 : (selectedCustomer ? 33 : 100)}
            maxSize={isCompact ? 100 : (selectedCustomer ? 33 : 100)}
            className="flex flex-col overflow-hidden bg-white border-r border-slate-200 min-w-[25%]"
          >
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
                  <div className="flex items-center gap-4 flex-1">
                    <DropdownMenu open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="gap-1.5 text-xl font-semibold text-slate-900 dark:text-white p-0 h-auto hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-left whitespace-normal"
                          data-testid="button-filter-dropdown"
                        >
                          <span className="line-clamp-2">
                            {getFilterLabel()}
                          </span>
                          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform shrink-0 ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64">
                        {CUSTOMER_FILTERS.map((filter) => (
                          <DropdownMenuItem
                            key={filter.id}
                            className={`flex items-center justify-between ${activeFilter === filter.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            onClick={() => {
                              setActiveFilter(filter.id);
                              setFilterDropdownOpen(false);
                            }}
                          >
                            <span className={activeFilter === filter.id ? 'font-medium text-blue-600' : ''}>
                              {filter.label}
                            </span>
                            <button
                              className="ml-2 text-slate-400 hover:text-yellow-500"
                              onClick={(e) => toggleFavorite(filter.id, e)}
                            >
                              {favoriteFilters.includes(filter.id) ? (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              ) : (
                                <Star className="w-4 h-4" />
                              )}
                            </button>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                  </div>

                  <div className="flex items-center gap-2">
                    {selectedCustomer ? (
                      isSearchVisible ? (
                        <div className="relative w-full max-w-[200px] animate-in slide-in-from-right-5 fade-in-0 duration-200">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            autoFocus
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onBlur={() => !searchTerm && setIsSearchVisible(false)}
                            className="pl-9 h-9"
                          />
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setIsSearchVisible(true)}
                        >
                          <Search className="h-4 w-4 text-slate-400" />
                        </Button>
                      )
                    ) : (
                      <div className="relative w-[240px] hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search customers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 h-9"
                        />
                      </div>
                    )}
                    <Button
                      onClick={() => setLocation("/customers/new")}
                      className={`bg-blue-600 hover:bg-blue-700 h-9 ${selectedCustomer ? 'w-9 px-0' : ''}`}
                      size={selectedCustomer ? "icon" : "default"}
                    >
                      <Plus className={`h-4 w-4 ${selectedCustomer ? '' : 'mr-2'}`} />
                      {!selectedCustomer && "New"}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuSub open={sortDropdownOpen} onOpenChange={setSortDropdownOpen}>
                          <DropdownMenuSubTrigger>
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            <span>Sort by</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => handleSort("name")}>Name</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSort("company")}>Company Name</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSort("receivables")}>Receivables</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSort("created_at")}>Created Time</DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={fetchCustomers}>
                          <RefreshCw className="mr-2 h-4 w-4" /> Refresh List
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex-1 overflow-auto scrollbar-hide">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <User className="h-12 w-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No customers found</h3>
                      <p className="text-slate-500 mb-4">Try adjusting your filters or search term.</p>
                      <Button onClick={() => setLocation("/customers/new")} className="bg-blue-600 hover:bg-blue-700">
                        Create New Customer
                      </Button>
                    </div>
                  ) : selectedCustomer ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${selectedCustomer?.id === customer.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-600' : ''}`}
                          onClick={() => handleCustomerClick(customer)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium ${selectedCustomer?.id === customer.id ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>
                              {customer.name}
                            </div>
                            <div className="text-sm text-slate-500 truncate">{customer.companyName || '-'}</div>
                            <div className="text-xs text-slate-400 mt-1">{formatCurrency(customer.outstandingReceivables || 0)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 overflow-auto scrollbar-hide">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                              <th className="px-4 py-3 text-left w-10">
                                <Checkbox
                                  checked={selectedCustomers.length === paginatedItems.length && paginatedItems.length > 0}
                                  onCheckedChange={(checked) => {
                                    if (checked) setSelectedCustomers(paginatedItems.map(c => c.id));
                                    else setSelectedCustomers([]);
                                  }}
                                />
                              </th>
                              <th className="px-4 py-3 text-left font-semibold">Name</th>
                              <th className="px-4 py-3 text-left font-semibold">Company Name</th>
                              <th className="px-4 py-3 text-left font-semibold">Email</th>
                              <th className="px-4 py-3 text-right font-semibold">Receivables</th>
                              <th className="px-4 py-3 text-center w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {paginatedItems.map((customer) => (
                              <tr
                                key={customer.id}
                                className={`hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${selectedCustomer?.id === customer.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                onClick={() => handleCustomerClick(customer)}
                              >
                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedCustomers.includes(customer.id)}
                                    onCheckedChange={() => toggleSelectCustomer(customer.id, {} as any)}
                                  />
                                </td>
                                <td className="px-4 py-3 text-blue-600 font-medium">{customer.name}</td>
                                <td className="px-4 py-3 text-slate-500">{customer.companyName || '-'}</td>
                                <td className="px-4 py-3 text-slate-500">{customer.email}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(customer.outstandingReceivables || 0)}</td>
                                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setLocation(`/customers/${customer.id}/edit`)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { setCustomerToDelete(customer.id); setDeleteDialogOpen(true); }} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex-none border-t border-slate-200 bg-white">
                        <TablePagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={totalItems}
                          itemsPerPage={itemsPerPage}
                          onPageChange={goToPage}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </ResizablePanel>
        )}

        {selectedCustomer && (
          <>
            {!isCompact && (
              <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            )}
            <ResizablePanel defaultSize={isCompact ? 100 : 65} minSize={isCompact ? 100 : 30} className="bg-white">
              <CustomerDetailPanel
                customer={selectedCustomer}
                onClose={handleClosePanel}
                onEdit={handleEditCustomer}
                onClone={handleClone}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteClick}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
