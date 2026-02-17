
export type ItemType = 'section' | 'step' | 'system';

export interface JourneyItem {
  id: string;
  type: ItemType;
  content: string;
  isNew?: boolean;
}

export interface ColumnData {
  id: 'current' | 'future';
  title: string;
  items: JourneyItem[];
}

export interface MapData {
  title: string;
  current: ColumnData;
  future: ColumnData;
}

export interface ProjectMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}
