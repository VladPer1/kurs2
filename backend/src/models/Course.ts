import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export type CourseStatus = 'draft' | 'published' | 'archived';

export interface CourseAttributes {
  id: string;
  instructor_id: string;
  title: string;
  description: string;
  price: number;
  start_date: Date;
  max_seats: number;
  available_seats: number;
  status: CourseStatus;
  duration: string;
  lessons_count: number;
  schedule: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CourseCreationAttributes
  extends Optional<CourseAttributes, 'id' | 'status' | 'available_seats' | 'duration' | 'lessons_count' | 'schedule'> {}

export class Course
  extends Model<CourseAttributes, CourseCreationAttributes>
  implements CourseAttributes
{
  declare id: string;
  declare instructor_id: string;
  declare title: string;
  declare description: string;
  declare price: number;
  declare start_date: Date;
  declare max_seats: number;
  declare available_seats: number;
  declare status: CourseStatus;
  declare duration: string;
  declare lessons_count: number;
  declare schedule: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare instructor?: any;
  declare enrollments?: any[];
  declare reviews?: any[];
}

Course.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    instructor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'instructors',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    max_seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    available_seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'published',
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '8 недель',
    },
    lessons_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 16,
    },
    schedule: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Вт, Чт 19:00',
    },
  },
  {
    sequelize,
    tableName: 'courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

