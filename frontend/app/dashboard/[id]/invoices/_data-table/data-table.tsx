"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { createColumns } from "./columns";
import Link from "next/link";
import { InvoiceObj, Payment } from "./types";
import { getInvoiceDetails, getInvoiceRows, getUser } from "@/lib/utils";
import EditInvoiceModal from "@/components/EditInvoiceModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

export function DataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // Global filter replaces the old email-only column filter — most
  // extracted invoices don't have an email at all, so searching by
  // customer name and invoice number (both always populated) is far more
  // useful.
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 7,
  });
  const [data, setData] = useState<Payment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);
  const [formData, setFormData] = useState<InvoiceObj | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedDelInvoiceId, setSelectedDelInvoiceId] = useState<
    null | string
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  async function getData() {
    try {
      setIsLoading(true);
      const user = await getUser();
      const id = user?.id;
      const dta = await getInvoiceRows(id);
      setData(dta);
    } catch (error) {
      console.log("error fetching the data", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    async function getInvoiceData() {
      if (selectedInvoice) {
        console.log(selectedInvoice.id);
        const data = await getInvoiceDetails(selectedInvoice.id);
        setFormData(data?.[0]);
      }
    }
    getInvoiceData();
  }, [selectedInvoice, isModalOpen]);

  const handleEditClick = (invoice: Payment) => {
    setSelectedInvoice(invoice);
    setFormData(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setOpenDeleteModal(true);
    setSelectedDelInvoiceId(id);
  };

  const handleDeleteSuccess = () => {
    getData();
    setOpenDeleteModal(false);
  };

  const columns = createColumns({
    onEditClick: handleEditClick,
    onDelClick: handleDeleteClick,
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    // Matches against customer name OR invoice number — case-insensitive
    // substring match on either field.
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase().trim();
      if (!search) return true;
      const customer = String(row.getValue("customer") ?? "").toLowerCase();
      const invoiceNo = String(row.getValue("id") ?? "").toLowerCase();
      return customer.includes(search) || invoiceNo.includes(search);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    state: {
      sorting,
      columnFilters,
      pagination,
      globalFilter,
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-50">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex justify-center items-center py-50">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex gap-7  items-center py-4">
            <Input
              placeholder="Search by customer or invoice number..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="flex-grow"
            />
            <Button>
              <Link href="invoices/create-invoice">Create Invoice</Link>
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={createColumns?.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
          <div>
            <EditInvoiceModal
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              invoice={formData}
              refreshData={getData}
            />
          </div>
          <div>
            <DeleteConfirmationModal
              open={openDeleteModal}
              onClose={() => setOpenDeleteModal(false)}
              id={selectedDelInvoiceId}
              onDeleteSuccess={handleDeleteSuccess}
            />
          </div>
        </>
      )}
    </div>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import {
//   ColumnDef,
//   ColumnFiltersState,
//   SortingState,
//   VisibilityState,
//   flexRender,
//   getCoreRowModel,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   useReactTable,
// } from "@tanstack/react-table";
// import { ChevronDown, Loader2 } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// import { createColumns } from "./columns";
// import Link from "next/link";
// import { InvoiceObj, Payment } from "./types";
// import { getInvoiceDetails, getInvoiceRows, getUser } from "@/lib/utils";
// import EditInvoiceModal from "@/components/EditInvoiceModal";
// import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

// export function DataTable() {
//   const [sorting, setSorting] = useState<SortingState>([]);
//   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
//   const [pagination, setPagination] = useState({
//     pageIndex: 0, // Starting page
//     pageSize: 7, // Rows per page
//   });
//   const [data, setData] = useState<Payment[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false); //state to track modal open state
//   const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null); //invoice data obj: this object contains partial data thats y only using the form id from this
//   const [formData, setFormData] = useState<InvoiceObj | null>(null); // contains all the data related to invoice
//   const [openDeleteModal, setOpenDeleteModal] = useState(false); //state to track the status of delete modal (is it open or closed)
//   const [selectedDelInvoiceId, setSelectedDelInvoiceId] = useState<
//     null | string
//   >(null);
//   const [isLoading, setIsLoading] = useState(true);

//   async function getData() {
//     try {
//       setIsLoading(true);
//       const user = await getUser();
//       const id = user?.id;
//       const dta = await getInvoiceRows(id);
//       setData(dta);
//     } catch (error) {
//       console.log("error fetching the data", error);
//       setData([]);
//     } finally {
//       setIsLoading(false);
//     }
//   }

//   useEffect(() => {
//     getData();
//   }, []);

//   useEffect(() => {
//     async function getInvoiceData() {
//       if (selectedInvoice) {
//         console.log(selectedInvoice.id);
//         const data = await getInvoiceDetails(selectedInvoice.id); // get the invoice details using inv no.
//         setFormData(data?.[0]);
//         //console.log(data?.[0]);
//       }
//     }
//     getInvoiceData();
//   }, [selectedInvoice, isModalOpen]);
//   // console.log(data);

//   const handleEditClick = (invoice: Payment) => {
//     setSelectedInvoice(invoice);
//     setFormData(null);
//     setIsModalOpen(true);
//   };

//   const handleDeleteClick = (id: string) => {
//     setOpenDeleteModal(true);
//     setSelectedDelInvoiceId(id);
//     console.log(selectedDelInvoiceId);
//     console.log("triggered");
//   };

//   const handleDeleteSuccess = () => {
//     getData(); // Refresh data after successful delete
//     setOpenDeleteModal(false);
//   };

//   // const handleClose = () => {
//   //   setIsModalOpen(false);
//   //   setFormData(null); // reset edits
//   // };

//   // const data = sampleData;

//   //tanstack api for table
//   const columns = createColumns({
//     onEditClick: handleEditClick,
//     onDelClick: handleDeleteClick,
//   });

//   const table = useReactTable({
//     data,
//     columns, //column defination
//     onSortingChange: setSorting,
//     onPaginationChange: setPagination, // Add pagination handler
//     onColumnFiltersChange: setColumnFilters,
//     getCoreRowModel: getCoreRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),

//     state: {
//       sorting,
//       columnFilters,
//       pagination,
//     },
//   });

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center py-50">
//         <Loader2 className="h-6 w-6 animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="w-full">
//       {isLoading ? (
//         <div className="flex justify-center items-center py-50">
//           <Loader2 className="h-6 w-6 animate-spin" />
//         </div>
//       ) : (
//         <>
//           <div className="flex gap-7  items-center py-4">
//             <Input
//               placeholder="Filter emails..."
//               value={
//                 (table.getColumn("email")?.getFilterValue() as string) ?? ""
//               }
//               onChange={(event) =>
//                 table.getColumn("email")?.setFilterValue(event.target.value)
//               }
//               className="flex-grow"
//             />
//             <Button>
//               <Link href="invoices/create-invoice">Create Invoice</Link>
//             </Button>
//           </div>
//           <div className="rounded-md border">
//             <Table>
//               <TableHeader>
//                 {table.getHeaderGroups().map((headerGroup) => (
//                   <TableRow key={headerGroup.id}>
//                     {headerGroup.headers.map((header) => {
//                       return (
//                         <TableHead key={header.id}>
//                           {header.isPlaceholder
//                             ? null
//                             : flexRender(
//                                 header.column.columnDef.header,
//                                 header.getContext(),
//                               )}
//                         </TableHead>
//                       );
//                     })}
//                   </TableRow>
//                 ))}
//               </TableHeader>
//               <TableBody>
//                 {table.getRowModel().rows?.length ? (
//                   table.getRowModel().rows.map((row) => (
//                     <TableRow
//                       key={row.id}
//                       data-state={row.getIsSelected() && "selected"}
//                     >
//                       {row.getVisibleCells().map((cell) => (
//                         <TableCell key={cell.id}>
//                           {flexRender(
//                             cell.column.columnDef.cell,
//                             cell.getContext(),
//                           )}
//                         </TableCell>
//                       ))}
//                     </TableRow>
//                   ))
//                 ) : (
//                   <TableRow>
//                     <TableCell
//                       colSpan={createColumns?.length}
//                       className="h-24 text-center"
//                     >
//                       No results.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//           <div className="flex items-center justify-between py-4">
//             <div className="text-sm text-muted-foreground">
//               Page {table.getState().pagination.pageIndex + 1} of{" "}
//               {table.getPageCount()}
//             </div>
//             <div className="flex gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => table.previousPage()}
//                 disabled={!table.getCanPreviousPage()}
//               >
//                 Previous
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => table.nextPage()}
//                 disabled={!table.getCanNextPage()}
//               >
//                 Next
//               </Button>
//             </div>
//           </div>
//           <div>
//             <EditInvoiceModal
//               open={isModalOpen}
//               onClose={() => setIsModalOpen(false)}
//               invoice={formData}
//               refreshData={getData}
//             />
//           </div>
//           <div>
//             <DeleteConfirmationModal
//               open={openDeleteModal}
//               onClose={() => setOpenDeleteModal(false)}
//               id={selectedDelInvoiceId}
//               onDeleteSuccess={handleDeleteSuccess}
//             />
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
