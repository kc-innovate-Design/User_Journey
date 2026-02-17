
export type ItemType = 'section' | 'step' | 'system';

export interface JourneyItem {
  id: string;
  type: ItemType;
  content: string;
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
