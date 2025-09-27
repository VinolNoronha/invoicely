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
import { ChevronDown } from "lucide-react";

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

export function DataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0, // Starting page
    pageSize: 7, // Rows per page
  });
  const [data, setData] = useState<Payment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false); //state to track modal open state
  const [selectedInvoice, setIsSelectedInvoice] = useState<Payment | null>(
    null
  ); //invoice data obj: this object contains partial data thats y only using the form id from this
  const [formData, setFormData] = useState<InvoiceObj | null>(null); // contains all the data related to invoice

  async function getData() {
    try {
      const user = await getUser();
      const id = user?.id;
      const dta = await getInvoiceRows(id);
      setData(dta);
    } catch (error) {
      console.log("error fetching the data", error);
      setData([]);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    async function getInvoiceData() {
      if (selectedInvoice) {
        console.log(selectedInvoice.id);
        const data = await getInvoiceDetails(selectedInvoice.id); // get the invoice details using inv no.
        setFormData(data?.[0]);
        //console.log(data?.[0]);
      }
    }
    getInvoiceData();
  }, [selectedInvoice, isModalOpen]);
  // console.log(data);

  const handleEditClick = (invoice: Payment) => {
    setIsSelectedInvoice(invoice);
    setFormData(null);
    setIsModalOpen(true);
  };

  // const handleClose = () => {
  //   setIsModalOpen(false);
  //   setFormData(null); // reset edits
  // };

  // const data = sampleData;

  //tanstack api for table
  const table = useReactTable({
    data,
    columns: createColumns({ onEditClick: handleEditClick }), //column defination
    onSortingChange: setSorting,
    onPaginationChange: setPagination, // Add pagination handler
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  return (
    <div className="w-full">
      <div className="flex gap-7  items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
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
                            header.getContext()
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
                        cell.getContext()
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
    </div>
  );
}
