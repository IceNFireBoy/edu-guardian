import { NoteFilter } from 'types/note';
import { NoteFilter as NoteFilterType } from '../noteTypes'; 

// Fix the setFilters callback
setFilters((prev: NoteFilter) => ({ ...prev, [name]: value }));

// Fix the tags handler
onChange={(e) => setFilters((prev: NoteFilter) => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) }))} 