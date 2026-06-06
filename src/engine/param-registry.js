/** 對齊原站 Fhc 參數（不含音訊／麥克風） */
export const PARAM_GROUPS = [
  {
    id: "element",
    titleEn: "Element",
    titleJa: "エレメント",
    params: [
      { key: "elementAngleDeg", labelEn: "Element / Angle", labelJa: "エレメント / 角度", min: 0, max: 360, step: 1 },
      { key: "baseScaleLength", labelEn: "Element / Length", labelJa: "エレメント / 長さ", min: 0.2, max: 6, step: 0.05 },
      { key: "baseScaleWidth", labelEn: "Element / Width", labelJa: "エレメント / 幅", min: 0.2, max: 6, step: 0.05 },
      { key: "pitch", labelEn: "Element / Pitch", labelJa: "エレメント / ピッチ", min: 0.01, max: 0.12, step: 0.002 },
      { key: "elementLineWidth", labelEn: "Element / Line Width", labelJa: "エレメント / 輪郭の太さ", min: 0.5, max: 4, step: 0.1 },
      { key: "elementOverlapMode", labelEn: "Element / Overlap", labelJa: "エレメント / 重なり", min: 0, max: 1, step: 1 },
    ],
  },
  {
    id: "shape",
    titleEn: "Shape",
    titleJa: "シェイプ",
    params: [
      { key: "shapeModifyFactor", labelEn: "Shape / Modify", labelJa: "シェイプ / 変形", min: 0, max: 0.4, step: 0.01 },
      { key: "shapeRotateFactor", labelEn: "Shape / Rotate", labelJa: "シェイプ / 回転", min: -3.14, max: 3.14, step: 0.05 },
      { key: "cameraZoomValue", labelEn: "Shape / Size", labelJa: "シェイプ / サイズ", min: 0.4, max: 2.5, step: 0.05 },
      { key: "shapePosX", labelEn: "Shape / Pos X", labelJa: "シェイプ / X位置", min: -200, max: 200, step: 1 },
      { key: "shapePosY", labelEn: "Shape / Pos Y", labelJa: "シェイプ / Y位置", min: -200, max: 200, step: 1 },
    ],
  },
  {
    id: "random",
    titleEn: "Randomness",
    titleJa: "ランダム",
    params: [
      { key: "randomnessMultiply", labelEn: "Randomness / Sensitivity", labelJa: "ランダム / 感度", min: 0, max: 8, step: 0.1 },
      { key: "randomnessSensitivityLength", labelEn: "Randomness / Length", labelJa: "ランダム感度 / 長さ", min: 0, max: 2, step: 0.05 },
      { key: "randomnessSensitivityWidth", labelEn: "Randomness / Width", labelJa: "ランダム性による要素の幅の変化", min: 0, max: 2, step: 0.05 },
      { key: "sharedScaleDirectionX", labelEn: "Shared Scale Direction X", labelJa: "共有のスケール方向X", min: -1, max: 1, step: 0.1 },
      { key: "sharedScaleDirectionY", labelEn: "Shared Scale Direction Y", labelJa: "共有のスケール方向Y", min: -1, max: 1, step: 0.1 },
    ],
  },
  {
    id: "mouse",
    titleEn: "Mouse",
    titleJa: "マウス",
    params: [
      { key: "mouseFollowDirection", labelEn: "Mouse / Follow Direction", labelJa: "マウス / 方向追従", min: 0, max: 1, step: 1 },
      { key: "mouseDirectionInfluence", labelEn: "Mouse / Direction Influence", labelJa: "マウス / 方向の強さ", min: 0, max: 1, step: 0.05 },
      { key: "scalingByMouseSensitivityLength", labelEn: "Mouse / Sensitivity / Length", labelJa: "マウス / 感度 / 長さ", min: 0, max: 5, step: 0.1 },
      { key: "scalingByMouseSensitivityWidth", labelEn: "Mouse / Sensitivity / Width", labelJa: "マウス / 感度 / 幅", min: 0, max: 5, step: 0.1 },
      { key: "mouseRadius", labelEn: "Mouse / Radius", labelJa: "マウス / 範囲", min: 40, max: 400, step: 5 },
      { key: "mouseSpeedStretch", labelEn: "Mouse / Speed Stretch", labelJa: "マウス / 速度ストレッチ", min: 0, max: 2, step: 0.05 },
      { key: "mouseSpeedScale", labelEn: "Mouse / Speed Scale", labelJa: "マウス / 速度スケール", min: 0, max: 2, step: 0.05 },
      { key: "mouseTrailStretch", labelEn: "Mouse / Trail Stretch", labelJa: "マウス / トレイル", min: 0, max: 3, step: 0.05 },
      { key: "mouseSmoothing", labelEn: "Mouse / Smoothing", labelJa: "マウス / スムージング", min: 0.05, max: 1, step: 0.05 },
      { key: "mouseSpeedAnim", labelEn: "Mouse / Speed Anim", labelJa: "マウス / 速度アニメ", min: 0, max: 2, step: 0.05 },
    ],
  },
  {
    id: "hand",
    titleEn: "Hand",
    titleJa: "手",
    params: [
      { key: "handPosX", labelEn: "Hand Pos X", labelJa: "手の位置X", min: -300, max: 300, step: 1 },
      { key: "handPosY", labelEn: "Hand Pos Y", labelJa: "手の位置Y", min: -300, max: 300, step: 1 },
      { key: "handInfluence", labelEn: "Hand / Influence", labelJa: "手 / 強度", min: 0, max: 4, step: 0.1 },
    ],
  },
];
