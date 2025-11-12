import mongoose, { Document, Schema } from 'mongoose';

export interface ISailArea {
  main: number;
  jib: number;
  genoa?: number;
  spinnaker?: number;
  asymmetrical?: number;
  codeZero?: number;
}

export interface IPolarPoint {
  twa: number;
  speed: number;
  vmg?: number;
}

export interface IPolarCurve {
  tws: number;
  points: IPolarPoint[];
}

export interface ISailPolarData {
  sailConfig: string;
  curves: IPolarCurve[];
  description?: string;
  windRange: {
    min: number;
    max: number;
  };
}

export interface IPolarDiagram extends Document {
  userId?: mongoose.Types.ObjectId;
  name: string;
  boatType: string;
  boatModel: string;
  description?: string;
  length: number;
  beam: number;
  displacement: number;
  sailArea: ISailArea;
  polarData: ISailPolarData[];
  isDefault: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PolarPointSchema = new Schema<IPolarPoint>({
  twa: { type: Number, required: true },
  speed: { type: Number, required: true },
  vmg: { type: Number },
});

const PolarCurveSchema = new Schema<IPolarCurve>({
  tws: { type: Number, required: true },
  points: [PolarPointSchema],
});

const SailPolarDataSchema = new Schema<ISailPolarData>({
  sailConfig: { type: String, required: true },
  curves: [PolarCurveSchema],
  description: { type: String },
  windRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
});

const SailAreaSchema = new Schema<ISailArea>({
  main: { type: Number, required: true },
  jib: { type: Number, required: true },
  genoa: { type: Number },
  spinnaker: { type: Number },
  asymmetrical: { type: Number },
  codeZero: { type: Number },
});

const PolarDiagramSchema = new Schema<IPolarDiagram>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    boatType: {
      type: String,
      required: true,
    },
    boatModel: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    length: {
      type: Number,
      required: true,
    },
    beam: {
      type: Number,
      required: true,
    },
    displacement: {
      type: Number,
      required: true,
    },
    sailArea: {
      type: SailAreaSchema,
      required: true,
    },
    polarData: [SailPolarDataSchema],
    isDefault: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PolarDiagramSchema.index({ userId: 1 });
PolarDiagramSchema.index({ boatModel: 1 });
PolarDiagramSchema.index({ isPublic: 1 });

export default mongoose.model<IPolarDiagram>('PolarDiagram', PolarDiagramSchema);
