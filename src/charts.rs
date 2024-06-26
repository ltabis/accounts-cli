use crate::transaction::Transaction;

pub fn build(transaction: &[Transaction]) {
    // Define chart related sizes.
    let width = 50 * transaction.len() as isize;
    let height = 600;
    let (top, right, bottom, left) = (90, 40, 50, 60);

    let smallest_amount = transaction.iter().fold(0.0, |state, op| {
        if op.amount() < state {
            op.amount()
        } else {
            state
        }
    });

    let biggest_amount = transaction.iter().fold(0.0, |state, op| {
        if op.amount() > state {
            op.amount()
        } else {
            state
        }
    });

    let mut data = Vec::<(String, f32)>::default();

    for op in transaction {
        match data.last_mut() {
            Some((date, amount)) if *date == op.date().to_string() => {
                *amount += op.amount() as f32;
            }
            _ => {
                data.push((op.date().to_string(), op.amount() as f32));
            }
        }
    }

    // Create a band scale that will interpolate values in [0, 200] to values in the
    // [0, availableWidth] range (the width of the chart without the margins).
    let x = charts::ScaleBand::new()
        .set_domain(data.iter().map(|(date, _)| date.clone()).collect())
        .set_range(vec![0, width - left - right]);

    // Create a linear scale that will interpolate values in [0, 100] range to corresponding
    // values in [availableHeight, 0] range (the height of the chart without the margins).
    // The [availableHeight, 0] range is inverted because SVGs coordinate system's origin is
    // in top left corner, while chart's origin is in bottom left corner, hence we need to invert
    // the range on Y axis for the chart to display as though its origin is at bottom left.
    let y = charts::ScaleLinear::new()
        .set_domain(vec![smallest_amount as f32, biggest_amount as f32])
        .set_range(vec![height - top - bottom, 0]);

    // Create Line series view that is going to represent the data.
    let line_view = charts::LineSeriesView::new()
        .set_x_scale(&x)
        .set_y_scale(&y)
        .set_marker_type(charts::MarkerType::Circle)
        .set_label_position(charts::PointLabelPosition::N)
        .load_data(&data.iter().map(|(x, y)| (x.clone(), *y)).collect())
        .unwrap();

    // Generate and save the chart.
    charts::Chart::new()
        .set_width(width)
        .set_height(height)
        .set_margins(top, right, bottom, left)
        .add_title(String::from("Expenses"))
        .add_view(&line_view)
        .add_axis_bottom(&x)
        .add_axis_left(&y)
        .add_left_axis_label("amount")
        .add_bottom_axis_label("Date")
        .save("line-chart.svg")
        .unwrap();
}
