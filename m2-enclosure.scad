$fa = 1;
$fs = 0.4;

module enclosure() {

    C = 0.3; // clearance
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
    screen_width = 50.10;
    screen_height = 38.47;
    screen_offset_left = 11.02;
    screen_offset_top = 3.42;

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

    module cover(flip=false) {
        module screenHole() {
            left = T + C + panel_offset_left + screen_offset_left;
            top = T + C + panel_offset_top + screen_offset_top;

            translate([left + C, top + C, 0]) cube([screen_width, screen_height, T]);
        }

        module front() {
            difference() {
                cube([width, height, T]);
                translate([0, 0, -0.01]) scale([1, 1, 1.01]) screenHole();
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

        module base() {
            union() {
                front();
                top();
                bottom();
                right();

                mounterPole(true, true);
                mounterPole(true, false);
                mounterPole(false, true);
                mounterPole(false, false);
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
            translate([0, T, 0])
                cube([width - T, base_height, T]);
        }

        union() {
            back();
            left();
            right();
        }
    }

    color("white") cover(flip=false);
    color("green") base();
}

enclosure();
