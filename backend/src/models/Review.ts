import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface ReviewAttributes {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReviewCreationAttributes
  extends Optional<ReviewAttributes, 'id'> {}

export class Review
  extends Model<ReviewAttributes, ReviewCreationAttributes>
  implements ReviewAttributes
{
  declare id: string;
  declare course_id: string;
  declare user_id: string;
  declare rating: number;
  declare comment: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare course?: any;
  declare user?: any;
}

Review.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['course_id', 'user_id'],
      },
    ],
  }
);
