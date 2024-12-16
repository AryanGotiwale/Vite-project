import React, { useState, useEffect, useRef } from 'react';

import { DataTable, DataTableStateEvent } from 'primereact/datatable'

import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import axios from 'axios';

interface Artwork {
  id: string;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Record<string, Artwork>>({});
  const [loading, setLoading] = useState(false);
  const [pageParams, setPageParams] = useState({ first: 0, rows: 10 });
  const [bulkSelectCount, setBulkSelectCount] = useState('');
  const overlayRef = useRef<OverlayPanel>(null);
  const [allPageSelected, setAllPageSelected] = useState(false);

  const fetchArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=10`);
      const { data, pagination } = response.data;
      setArtworks(
        data.map((item: any) => ({
          id: item.id,
          title: item.title,
          place_of_origin: item.place_of_origin,
          artist_display: item.artist_display,
          inscriptions: item.inscriptions,
          date_start: item.date_start,
          date_end: item.date_end,
        }))
      );
      setTotalRecords(pagination.total);
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalPages = async (requiredCount: number) => {
    const allRecords: Artwork[] = [];
    let currentPage = 1;

    while (allRecords.length < requiredCount) {
      try {
        const response = await axios.get(
          `https://api.artic.edu/api/v1/artworks?page=${currentPage}&limit=10`
        );
        const { data } = response.data;
        allRecords.push(
          ...data.map((item: any) => ({
            id: item.id,
            title: item.title,
            place_of_origin: item.place_of_origin,
            artist_display: item.artist_display,
            inscriptions: item.inscriptions,
            date_start: item.date_start,
            date_end: item.date_end,
          }))
        );
        currentPage++;
      } catch (error) {
        console.error('Error fetching additional records:', error);
        break;
      }
    }
    return allRecords.slice(0, requiredCount);
  };

  useEffect(() => {
    fetchArtworks(1);
  }, []);

  // const onPageChange = (e: DataTablePageParams) => {
  //   const page = e.page + 1;
  //   setPageParams({ first: e.first, rows: e.rows });
  //   fetchArtworks(page);
  // };
  const onPageChange = (event: DataTableStateEvent) => {
    const page = event.page ? event.page + 1 : 1; 
    setPageParams({ first: event.first ?? 0, rows: event.rows ?? 10 });
    fetchArtworks(page);
  };
  const handleBulkSelect = async () => {
    const count = parseInt(bulkSelectCount, 10);
    if (isNaN(count) || count <= 0) {
      alert('Please Enter A Valid Number ');
      return;
    }
  
    const recordsToSelect = await fetchAdditionalPages(count);
    const updatedSelections: Record<string, Artwork> = {};
  
    
    recordsToSelect.forEach((record) => {
      updatedSelections[record.id] = record;
    });
  
    setSelectedRows(updatedSelections);
    overlayRef.current?.hide(); 
  };

  const isRowSelected = (rowData: Artwork) => !!selectedRows[rowData.id];

  const handleRowCheckboxChange = (rowData: Artwork) => {
    if (isRowSelected(rowData)) {
      setSelectedRows((prev) => {
        const updated = { ...prev };
        delete updated[rowData.id];
        return updated;
      });
    } else {
      setSelectedRows((prev) => ({ ...prev, [rowData.id]: rowData }));
    }
  };

  const handleSelectAllOnPage = () => {
    if (allPageSelected) {
      const updatedSelections = { ...selectedRows };
      artworks.forEach((record) => {
        delete updatedSelections[record.id];
      });
      setSelectedRows(updatedSelections);
    } else {
      const updatedSelections = { ...selectedRows };
      artworks.forEach((record) => {
        updatedSelections[record.id] = record;
      });
      setSelectedRows(updatedSelections);
    }
    setAllPageSelected((prev) => !prev);
  };

  return (
    <div className="p-m-4">
      <h2>React Project</h2>
      <div style={{ marginBottom: '1rem' }}>
        <Button className='Bulk-Check-btn' icon="pi pi-check" onClick={(e) => overlayRef.current?.toggle(e)} />
      </div>
      <OverlayPanel ref={overlayRef}>
        <div style={{ padding: '1rem' }}>
          <h4>Bulk Selection</h4>
          <InputText
            value={bulkSelectCount}
            onChange={(e) => setBulkSelectCount(e.target.value)}
            placeholder="Enter number"
            style={{ marginBottom: '0.5rem', width: '100%' }}
          />
          <Button className='Apply-btn' label="Apply" icon="pi pi-check" onClick={handleBulkSelect} />
        </div>
      </OverlayPanel>
      <Button
        label={allPageSelected ? "Unselect All on Page" : "Select All on Page"}
        icon="pi pi-check-square"
        className="All-Select-btn"
        onClick={handleSelectAllOnPage}
        style={{ marginBottom: '1rem', backgroundColor:''}}
      />
      <DataTable
      className='DataTable-class'
        value={artworks}
        paginator
        showGridlines
        stripedRows
        rows={pageParams.rows}
        totalRecords={totalRecords}
        lazy
        removableSort
        first={pageParams.first}
        onPage={onPageChange}
        loading={loading}
        dataKey="id"
        rowClassName={(rowData) => (isRowSelected(rowData) ? 'p-highlight' : '')}
      >
        <Column 
        
          headerStyle={{ width: '5em' }}
          body={(rowData) => (
            <input style={{width:'1.3rem',
                           height:'1.3rem',
                           cursor:'pointer'}}
              type="checkbox"
              checked={isRowSelected(rowData)}
              onChange={() => handleRowCheckboxChange(rowData)}
            />
          )}
        />
        
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
        {/* <Column /> */}
      </DataTable>
    </div>
  );
};

export default App;