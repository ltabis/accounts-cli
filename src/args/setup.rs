// setup.rs
// setup configuration for all arguments.

use crate::args::arg;

pub fn setup_args() -> arg::Block {
    let mut args = arg::Block::new("", "", true);

    args.register_blocks_ref(vec![
        arg::Block::new(
            "-n",
            "--new",
            true,
        ).register_args(vec![
	    arg::Arg {
		value: String::from("account"),
		required: true
	    },
	]),
        arg::Block::new(
            "",
            "",
            false,
        ).register_args(vec![
	    arg::Arg {
		value: String::from("label"),
		required: true
	    },
	    arg::Arg {
		value: String::from("amount"),
		required: true
	    }
	]),
        arg::Block::new(
            "",
            "",
            false,
        ).register_args(vec![
	    arg::Arg {
		value: String::from("date"),
		required: true
	    },
	    arg::Arg {
		value: String::from("note"),
		required: true
	    }
	]),
    ]);

    args.register_args_ref(vec![
	arg::Arg {
	    value: String::from("account"),
	    required: true
	}
    ]);

    args
}