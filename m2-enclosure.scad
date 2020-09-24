$fa = 1;
$fs = 0.1;
Flip = true;
SnapRadius = 0.7;
SnapCount = 10;
SnapMargin = 6;

module enclosure() {

    C = 0.25; // clearance
    T = 2; // basic thickness
    S = 2; // space between base and Moddable Two

    // Body and PCB board
    body_width = 81.73;
    body_height = 47.37;
    body_depth = 4.64;

    // LCD panel
    panel_width = 66.68;
    panel_height = 44.23;
    panel_depth = 1.04;
    panel_offset_left = 9.34;
    panel_offset_top = 2.10;

    // Screen
    screen_width = 49.48;
    screen_height = 37.57;
    screen_offset_left = 11.76;
    screen_offset_top = 4.02;

    // Entire dimmension
    max_width = body_width;
    max_height = body_height;
    max_depth = 8.42;

    // Mount hole
    hole_diameter = 2.5;
    hole_radius = hole_diameter / 2;
    hole_offset_left = 1.47;
    hole_offset_top = 1.60;
    hole_offset_right = 1.2;
    hole_offset_bottom = 1.2;

    // Whole model
        // adjustment. make left and right side equal width.
        left_width = T + C + panel_offset_left + screen_offset_left;

    width = left_width * 2 + screen_width; // max_width + C * 2 + T * 2;
    height = max_height + C * 2 + T * 2;
    depth = max_depth + C * 2 + T * 2 + S;

    module rCutOut(radius=T, height=1, rotate=0) {
        D = 0.1;
        h = height + D * 2;
        rotate([0, 0, 180 + rotate])
            translate([-radius, -radius, 0])
                difference() {
                    translate([0, 0, -D]) cube([radius + D, radius + D, h]);
                    translate([0, 0, -D * 2]) cylinder(r=T, h=h + D * 2);
                }
    }

    module snap() {
        radius = SnapRadius;
        dx = (width - SnapMargin * 2) / (SnapCount - 1);

        for (i=[0:SnapCount - 1]) {
            translate([SnapMargin + i * dx, 0, 0])
            sphere(r=radius);
        }
        
    }

    module cover(flip=false) {
        module screenHole() {
            function scaleForAngle(length, height, angle) =
                (length + 2 * height * tan(angle)) / length;
            function scalesForAngle(width, height, depth, angle) =
                [scaleForAngle(width, depth, angle), scaleForAngle(height, depth, angle)];

            left = T + C + panel_offset_left + screen_offset_left;
            top = T + C + panel_offset_top + screen_offset_top;
            scale = scalesForAngle(screen_width, screen_height, T, 45);

            translate([left + C, top + C, 0])
                translate([screen_width / 2, screen_height / 2, T])
                    rotate([180, 0, 0])
                        linear_extrude(height=T, scale=scale)
                            square([screen_width, screen_height], center=true);
        }

        module front() {
            difference() {
                cube([width, height, T]);
                translate([0, 0, -0.001]) scale([1, 1, 1.01]) screenHole();
            }
        }

        module top() {
            cube([width, T, depth]);
        }

        module bottom() {
            translate([0, height - T, 0]) top();
        }

        module right() {
            translate([width - T, 0, 0]) cube([T, height, depth]);
        }

        module mounterPole(isLeft, isTop) {
            function mounterPosition(left, top) =
                let (
                    d = T + C,
                    r = hole_radius,
                    left = d + hole_offset_left + r,
                    top = d + hole_offset_top + r,
                    right = max_width + d - hole_offset_right - r,
                    bottom = max_height + d - hole_offset_bottom - r
                )
                isLeft
                    ? isTop
                        ? [left, top, 0]
                        : [left, bottom, 0]
                    : isTop
                        ? [right, top, 0]
                        : [right, bottom, 0];

            h = T + panel_depth + body_depth + 2;
            r = hole_radius * 0.9;

            translate(mounterPosition())
                cylinder(r=hole_radius, h=h);
        }

        module rightStopper() {
            y = 10;
            stopper_height = T + C + panel_depth + body_depth + T;
            translate([T + C + max_width, (height - y) / 2, 0]) union() {
               cube([T, y, stopper_height]);
               translate([-T, 0, stopper_height - T]) cube([T * 2, y, T]);
            }
        }

        module leftStopper(isTop) {
            radius = 1;
            length = 8;
            z = T + C + panel_depth + body_depth + radius;

            module body() {
                translate([T + C, T, z])
                    rotate([0, 90, 0])
                        cylinder(r=radius, h=length);
            }

            if (isTop)
                body();
            else
                translate([0, max_height + C * 2, 0])
                    body();
        }

        module base() {
            difference() {
                union() {
                    front();
                    top();
                    bottom();
                    right();

                    rightStopper();
                    leftStopper(true);
                    leftStopper(false);

                    translate([0, T, depth - T / 2]) snap();
                    translate([0, height - T, depth - T / 2]) snap();
                }
                rCutOut(height=depth);
                translate([width, 0, 0]) rCutOut(height=depth, rotate=90);
                translate([width, height, 0]) rCutOut(height=depth, rotate=180);
                translate([0, height, 0]) rCutOut(height=depth, rotate=270);
            }
        }

        if (flip)
            translate([0, height * 1.2, 0])
                base();
        else
            translate([0, height, depth])
                rotate([180, 0, 0])
                    base();
    }

    module base() {
        base_height = height - T * 2;

        module usbCutOut() {
            cutout_width = 15;
            cutout_height = 10;
            cutout_center_from_bottom = 11.60;
            usb_height = 3.60;

            cutout_y = cutout_center_from_bottom - cutout_width / 2;
            cutout_z = depth - T - panel_depth - body_depth - usb_height / 2 - cutout_height / 2;

            translate([0, cutout_y, cutout_z])
                cube([T, cutout_width, cutout_height]);
        }

        module left() { // USB Connector side
            translate([0, T + C, 0])
                difference() {
                    cube([T, base_height - C * 2, depth - T]);
                    scale([1.1, 1, 1])
                        translate([-0.01, 0, 0])
                            usbCutOut();
                }
        }

        module right() { // To hold the cover 
            translate([width - T * 2, T + C, 0])
                cube([T, base_height - C * 2, depth - T]);
        }

        module back() {
            module cutOut() {
                dx = 12;
                dy = 8;

                translate([dx, dy, 0])
                    cube([width - T - dx * 2, base_height - dy * 2, T]);
            }

            translate([0, T, 0])
                difference() {
                    cube([width - T, base_height, T]);
                    scale([1, 1, 1.1]) translate([0, 0, -0.01]) cutOut();
                    translate([0, 0, T / 2]) snap();
                    translate([0, height - 2 * T, T / 2]) snap();
                }
        }

        union() {
            back();
            left();
            right();
        }
    }

    color("white") cover(flip=Flip);
    color("green") base();
}

enclosure();
