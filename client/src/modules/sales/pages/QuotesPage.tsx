import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Plus, MoreHorizontal, ChevronDown, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import QuoteDetailPanel from "../components/QuoteDetailPanel";

interface QuoteListItem {
  id: string;
  date: string;
  quoteNumber: string;
  referenceNumber: string;
  customerName: string;
  status: string;
  convertedTo?: string;
  total: number;
}

interface QuoteDetail {
  id: string;
  quoteNumber: string;
  referenceNumber: string;
  date: string;
  expiryDate: string;
  customerId: string;
  customerName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  salesperson: string;
  projectName: string;
  subject: string;
  placeOfSupply: string;
  pdfTemplate: string;
  items: any[];
  subTotal: number;
  shippingCharges: number;
  cgst: number;
  sgst: number;
  igst: number;
  adjustment: number;
  total: number;
  customerNotes: string;
  termsAndConditions: string;
  status: string;
  emailRecipients: string[];
  createdAt: string;
  activityLogs: any[];
}

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ACCEPTED':
      return 'text-green-600 bg-green-50 px-2 py-0.5 rounded';
    case 'SENT':
      return 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded';
    case 'DRAFT':
      return 'text-slate-500 bg-slate-100 px-2 py-0.5 rounded';
    case 'DECLINED':
      return 'text-red-600 bg-red-50 px-2 py-0.5 rounded';
    case 'CONVERTED':
      return 'text-purple-600 bg-purple-50 px-2 py-0.5 rounded';
    default:
      return 'text-slate-500 bg-slate-100 px-2 py-0.5 rounded';
  }
};

const getStatusDisplayText = (status: string, convertedTo?: string) => {
  const upperStatus = status.toUpperCase();
  if (upperStatus === 'CONVERTED') {
    if (convertedTo === 'invoice') {
      return 'Converted To Invoice';
    } else if (convertedTo === 'sales-order') {
      return 'Converted To Sales Order';
    }
    return 'Converted';
  }
  if (upperStatus === 'SENT') {
    return 'Quotation Sent';
  }
  if (upperStatus === 'DRAFT') {
    return 'Draft';
  }
  if (upperStatus === 'ACCEPTED') {
    return 'Accepted';
  }
  if (upperStatus === 'DECLINED') {
    return 'Declined';
  }
  if (upperStatus === 'EXPIRED') {
    return 'Expired';
  }
  return status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function QuotesPage() {
  const [, setLocation] = useLocation();
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    fetchQuotes();
    const checkCompact = () => {
      setIsCompact(window.innerWidth < 1280);
    };
    checkCompact();
    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuoteDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/quotes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedQuote(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch quote detail:', error);
    }
  };

  const handleQuoteClick = (quote: QuoteListItem) => {
    fetchQuoteDetail(quote.id);
  };

  const handleClosePanel = () => {
    setSelectedQuote(null);
  };

  const handleEditQuote = () => {
    if (selectedQuote) {
      setLocation(`/quotes/${selectedQuote.id}/edit`);
    }
  };

  const toggleSelectQuote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedQuotes.includes(id)) {
      setSelectedQuotes(selectedQuotes.filter(i => i !== id));
    } else {
      setSelectedQuotes([...selectedQuotes, id]);
    }
  };

  const applyFilter = (quoteList: QuoteListItem[]) => {
    if (activeFilter === "All") return quoteList;
    return quoteList.filter(quote => {
      const status = quote.status.toUpperCase();
      switch (activeFilter) {
        case "Draft":
          return status === "DRAFT";
        case "Pending Approval":
          return status === "PENDING_APPROVAL";
        case "Approved":
          return status === "APPROVED";
        case "Sent":
          return status === "SENT";
        case "Customer Viewed":
          return status === "CUSTOMER_VIEWED";
        case "Accepted":
          return status === "ACCEPTED";
        case "Invoiced":
          return status === "INVOICED" || status === "CONVERTED";
        case "Declined":
          return status === "DECLINED";
        default:
          return true;
      }
    });
  };

  const filteredQuotes = applyFilter(quotes).filter(quote =>
    quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredQuotes, 10);

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup key={`${selectedQuote ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
        {(!isCompact || !selectedQuote) && (
          <ResizablePanel
            defaultSize={isCompact ? 100 : (selectedQuote ? 29 : 100)}
            minSize={isCompact ? 100 : (selectedQuote ? 29 : 100)}
            maxSize={isCompact ? 100 : (selectedQuote ? 29 : 100)}
            className="flex flex-col overflow-hidden bg-white min-w-[25%]"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 text-xl font-semibold text-slate-900 hover:text-slate-700 transition-colors text-left whitespace-normal">
                        <span className="line-clamp-2">{activeFilter === "All" ? "All Quotes" : `${activeFilter} Quotes`}</span>
                        <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {["All", "Draft", "Pending Approval", "Approved", "Sent", "Customer Viewed", "Accepted", "Invoiced", "Declined"].map(filter => (
                        <DropdownMenuItem key={filter} onClick={() => setActiveFilter(filter)}>
                          {filter}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span className="text-sm text-slate-400">({quotes.length})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedQuote ? (
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
                      className="h-9 w-9 px-0"
                      onClick={() => setIsSearchVisible(true)}
                    >
                      <Search className="h-4 w-4 text-slate-400" />
                    </Button>
                  )
                ) : (
                  <div className="relative w-[240px] hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search quotes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                )}

                <Button
                  onClick={() => setLocation("/quotes/new")}
                  className={`bg-blue-600 hover:bg-blue-700 h-9 gap-1.5 ${selectedQuote ? 'w-9 px-0' : ''}`}
                  size={selectedQuote ? "icon" : "default"}
                >
                  <Plus className={`h-4 w-4 ${selectedQuote ? '' : 'mr-1.5'}`} />
                  {!selectedQuote && "New"}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={fetchQuotes}>Refresh List</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-hide">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading quotes...</div>
              ) : filteredQuotes.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No quotes found.</div>
              ) : selectedQuote ? (
                <div className="divide-y divide-slate-100">
                  {paginatedItems.map((quote) => (
                    <div
                      key={quote.id}
                      className={`p-4 hover:bg-slate-50 cursor-pointer ${selectedQuote.id === quote.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}
                      onClick={() => handleQuoteClick(quote)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className={`font-medium ${selectedQuote.id === quote.id ? 'text-blue-600' : 'text-slate-900'}`}>{quote.customerName}</div>
                        <div className="text-sm font-medium text-slate-900">{formatCurrency(quote.total)}</div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-slate-500">
                        <div>{quote.quoteNumber}</div>
                        <div className={`text-xs font-medium ${getStatusColor(quote.status)}`}>
                          {getStatusDisplayText(quote.status, quote.convertedTo)}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{formatDate(quote.date)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left w-10">
                        <Checkbox
                          checked={selectedQuotes.length === filteredQuotes.length && filteredQuotes.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedQuotes(filteredQuotes.map(q => q.id));
                            else setSelectedQuotes([]);
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Number</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedItems.map((quote) => (
                      <tr key={quote.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleQuoteClick(quote)}>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedQuotes.includes(quote.id)}
                            onCheckedChange={() => toggleSelectQuote(quote.id, { stopPropagation: () => { } } as React.MouseEvent)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(quote.date)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{quote.quoteNumber}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{quote.customerName}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${getStatusColor(quote.status)}`}>
                            {getStatusDisplayText(quote.status, quote.convertedTo)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">{formatCurrency(quote.total)}</td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/quotes/${quote.id}/edit`); }}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/quotes/create?cloneFrom=${quote.id}`); }}>Clone</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {filteredQuotes.length > 0 && (
              <div className="flex-none border-t border-slate-200 bg-white">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={goToPage}
                />
              </div>
            )}
          </ResizablePanel>
        )}

        {selectedQuote && (
          <>
            {!isCompact && (
              <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            )}
            <ResizablePanel defaultSize={isCompact ? 100 : 71} minSize={isCompact ? 100 : 30} className="bg-slate-50">
              <div className="h-full overflow-hidden">
                <QuoteDetailPanel
                  quote={selectedQuote}
                  onClose={handleClosePanel}
                  onEdit={handleEditQuote}
                  onRefresh={() => {
                    fetchQuotes();
                    setSelectedQuote(null);
                  }}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
