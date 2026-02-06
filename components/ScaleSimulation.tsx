import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

// --- Constants & Types ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BLOCK_SIZE = 80;
const FIXED_WEIGHT_VAL = 10;

// Layout constants
const GROUND_Y = 500;
const SCALE_BASE_Y = 500;
const SCALE_BASE_WIDTH = 380;
const SCALE_BASE_HEIGHT = 140;
const PLATE_WIDTH = 420;
const PLATE_HEIGHT = 20;
const SCALE_STEM_HEIGHT = 30; // Min height of the stem connecting base to plate

// Colors
const C_PURPLE = '#a855f7';
const C_PURPLE_DARK = '#7e22ce';
const C_METAL = '#9ca3af';
const C_METAL_DARK = '#4b5563';
const C_SCALE_BODY = '#374151'; // dark slate
const C_SCALE_SCREEN = '#e2e8f0'; // light slate
const C_TEXT = '#1e293b';

interface DraggableBlock {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isDragging: boolean;
  isOnScale: boolean;
  color: string;
}

interface ScaleSimulationProps {
  blockWeight: number;
}

const ScaleSimulation: React.FC<ScaleSimulationProps> = ({ blockWeight }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blockWeightRef = useRef(blockWeight);

  // Sync prop to ref for p5 to access inside the closure
  useEffect(() => {
    blockWeightRef.current = blockWeight;
  }, [blockWeight]);
  
  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      // --- State ---
      let blocks: DraggableBlock[] = [];
      let plateY = SCALE_BASE_Y - SCALE_BASE_HEIGHT - SCALE_STEM_HEIGHT;
      let targetPlateY = plateY;
      let currentDisplayValue = 0;
      let targetDisplayValue = 0;

      // Fixed weight object properties
      const fixedWeight = {
        val: FIXED_WEIGHT_VAL,
        x: 0,
        y: 0,
        w: 100,
        h: 90,
        isOnScale: true
      };

      // Fonts
      let fontRegular: string = 'Inter, sans-serif';
      let fontSerif: string = 'Crimson Pro, serif';

      // --- Setup ---
      p.setup = () => {
        const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        canvas.style('display', 'block');
        canvas.style('max-width', '100%');
        canvas.style('max-height', '100%');
        canvas.style('width', '100%');
        canvas.style('height', '100%');
        canvas.style('object-fit', 'contain');
        
        p.textFont(fontRegular);

        // Initialize blocks
        for (let i = 0; i < 3; i++) {
          blocks.push({
            id: i,
            x: 50 + i * (BLOCK_SIZE + 20),
            y: GROUND_Y - BLOCK_SIZE,
            w: BLOCK_SIZE,
            h: BLOCK_SIZE,
            isDragging: false,
            isOnScale: false,
            color: C_PURPLE
          });
        }
        
        // Start with one block on scale for better UX hint
        const firstBlock = blocks[0];
        firstBlock.isOnScale = true;
        firstBlock.x = CANVAS_WIDTH / 2 - 80;
      };

      // --- Draw Loop ---
      p.draw = () => {
        p.clear();
        p.background(255);

        updatePhysics();

        // 1. Floor
        p.noStroke();
        p.fill(245);
        p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

        // 2. Scale Body
        drawScaleBody();

        // 3. Plate
        drawScalePlate(plateY);

        // 4. Fixed Weight
        drawFixedWeight();

        // 5. Blocks
        blocks.forEach(b => drawBlock(b));
      };

      // --- Helper Functions ---

      function updatePhysics() {
        // 1. Determine which blocks are on the scale
        let scaleWeightCount = 0;
        
        blocks.forEach(b => {
          if (b.isDragging) return;

          const plateLeft = (CANVAS_WIDTH - PLATE_WIDTH) / 2;
          const plateRight = plateLeft + PLATE_WIDTH;
          const blockCenter = b.x + b.w / 2;

          if (blockCenter > plateLeft && blockCenter < plateRight) {
             b.isOnScale = true;
             b.y = plateY - b.h;
          } else {
             b.isOnScale = false;
             b.y = GROUND_Y - b.h;
          }
        });

        scaleWeightCount = blocks.filter(b => b.isOnScale).length;
        
        // Total Value Calculation using the REF
        const currentBlockWeight = blockWeightRef.current;
        const totalValue = fixedWeight.val + (scaleWeightCount * currentBlockWeight);
        targetDisplayValue = totalValue;

        // Animate Display Number
        currentDisplayValue = p.lerp(currentDisplayValue, targetDisplayValue, 0.1);

        // Calculate Plate Depression
        const baseDepression = 10; 
        // Use a visual multiplier for depression, doesn't need to match weight exactly pixel-for-pixel
        const addedDepression = (scaleWeightCount * currentBlockWeight) * 1.5; 
        const depression = baseDepression + addedDepression;

        const anchorY = SCALE_BASE_Y - SCALE_BASE_HEIGHT - SCALE_STEM_HEIGHT;
        targetPlateY = anchorY + depression;
        
        plateY = p.lerp(plateY, targetPlateY, 0.15);
        
        // Update Fixed Weight Y
        fixedWeight.x = (CANVAS_WIDTH / 2) + 40; 
        fixedWeight.y = plateY - fixedWeight.h;
      }

      function drawScaleBody() {
        p.push();
        const centerX = CANVAS_WIDTH / 2;
        
        // Main Body Base
        p.fill(C_SCALE_BODY);
        p.stroke(C_METAL_DARK);
        p.strokeWeight(2);
        p.rect(centerX - SCALE_BASE_WIDTH/2, SCALE_BASE_Y - SCALE_BASE_HEIGHT, SCALE_BASE_WIDTH, SCALE_BASE_HEIGHT, 15);

        // Display Screen Area
        p.fill(C_SCALE_SCREEN);
        p.stroke('#cbd5e1');
        p.rect(centerX - 120, SCALE_BASE_Y - SCALE_BASE_HEIGHT + 30, 240, 80, 8);

        // Display Number
        p.fill(C_TEXT);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont(fontSerif);
        p.textSize(64);
        
        p.text(Math.round(currentDisplayValue), centerX, SCALE_BASE_Y - SCALE_BASE_HEIGHT + 70);
        
        p.pop();
      }

      function drawScalePlate(y: number) {
        p.push();
        const centerX = CANVAS_WIDTH / 2;
        
        // Stem
        p.fill('#94a3b8');
        p.stroke(C_METAL_DARK);
        p.strokeWeight(2);
        const bodyTopY = SCALE_BASE_Y - SCALE_BASE_HEIGHT;
        p.rect(centerX - 20, y, 40, bodyTopY - y + 5);

        // Plate
        p.fill('#cbd5e1');
        p.rect(centerX - PLATE_WIDTH/2, y, PLATE_WIDTH, PLATE_HEIGHT, 4);
        
        // Shadow/Detail
        p.noStroke();
        p.fill(255, 255, 255, 100);
        p.rect(centerX - PLATE_WIDTH/2, y, PLATE_WIDTH, 5, 4);

        p.pop();
      }

      function drawFixedWeight() {
        p.push();
        p.translate(fixedWeight.x, fixedWeight.y);
        
        p.fill(C_METAL);
        p.stroke(C_METAL_DARK);
        p.strokeWeight(2);
        
        p.beginShape();
        p.vertex(10, fixedWeight.h);
        p.vertex(fixedWeight.w - 10, fixedWeight.h);
        p.vertex(fixedWeight.w - 20, 25);
        p.vertex(20, 25);
        p.endShape(p.CLOSE);

        // Handle
        p.noFill();
        p.stroke(C_METAL_DARK);
        p.strokeWeight(4);
        p.arc(fixedWeight.w / 2, 25, 40, 40, p.PI, 0);

        // Label
        p.fill(C_TEXT);
        p.noStroke();
        p.textFont(fontSerif);
        p.textSize(32);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(fixedWeight.val, fixedWeight.w / 2, fixedWeight.h / 2 + 15);

        p.pop();
      }

      function drawBlock(b: DraggableBlock) {
        p.push();
        
        if (b.isDragging) {
          p.fill(0, 0, 0, 20);
          p.noStroke();
          p.rect(b.x + 10, b.y + 10, b.w, b.h, 8);
        }

        p.translate(b.x, b.y);

        p.stroke(C_PURPLE_DARK);
        p.strokeWeight(2);
        p.fill(b.color);
        p.rect(0, 0, b.w, b.h, 6);

        // Highlight
        p.noStroke();
        p.fill(255, 255, 255, 50);
        p.beginShape();
        p.vertex(6, 6); 
        p.vertex(25, 6);
        p.vertex(6, 25);
        p.endShape(p.CLOSE);
        
        p.pop();
      }

      // --- Interaction ---

      let draggedBlockId: number | null = null;
      let dragOffsetX = 0;
      let dragOffsetY = 0;

      p.mousePressed = () => {
        for (let i = blocks.length - 1; i >= 0; i--) {
          const b = blocks[i];
          if (
            p.mouseX >= b.x &&
            p.mouseX <= b.x + b.w &&
            p.mouseY >= b.y &&
            p.mouseY <= b.y + b.h
          ) {
            draggedBlockId = b.id;
            b.isDragging = true;
            dragOffsetX = p.mouseX - b.x;
            dragOffsetY = p.mouseY - b.y;
            
            blocks.splice(i, 1);
            blocks.push(b);
            break;
          }
        }
      };

      p.mouseDragged = () => {
        if (draggedBlockId !== null) {
          const b = blocks.find(blk => blk.id === draggedBlockId);
          if (b) {
            b.x = p.mouseX - dragOffsetX;
            b.y = p.mouseY - dragOffsetY;
          }
        }
      };

      p.mouseReleased = () => {
        if (draggedBlockId !== null) {
          const b = blocks.find(blk => blk.id === draggedBlockId);
          if (b) {
            b.isDragging = false;
          }
          draggedBlockId = null;
        }
      };
    };

    const myP5 = new p5(sketch, containerRef.current);

    return () => {
      myP5.remove();
    };
  }, []); // Empty dependency array ensures we only setup once, refs handle updates

  return <div ref={containerRef} className="w-full h-full flex items-center justify-center" style={{ minHeight: '400px', position: 'relative' }} />;
};

export default ScaleSimulation;